import { prisma } from "@devforge/database"
import fs from 'fs'
import path from 'path'

export async function getSkillTree(userId: string, treeId?: string) {
  const whereClause = treeId ? { id: treeId } : {}
  
  let tree = await prisma.skillTree.findFirst({
    where: whereClause,
    include: {
      nodes: {
        include: {
          progress: {
            where: { userId }
          }
        }
      }
    }
  })

  // If no tree exists, seed the initial ones
  if (!tree && !treeId) {
    await syncCoursesFromContent()
    tree = await prisma.skillTree.findFirst({
      include: {
        nodes: {
          include: {
            progress: {
              where: { userId }
            }
          }
        }
      }
    })
  }

  if (!tree) throw new Error("Failed to load skill tree")

  // Format the nodes for the frontend React Flow
  const formattedNodes = tree.nodes.map(node => {
    const userProgress = node.progress[0]
    return {
      id: node.id,
      position: { x: node.xPos, y: node.yPos },
      data: {
        label: node.title,
        type: node.type,
        status: userProgress ? userProgress.status : (node.dependsOn && node.dependsOn.length === 0 ? "UNLOCKED" : "LOCKED"),
        description: node.description,
        problemSlug: node.problemSlug,
      }
    }
  })

  // Generate edges based on dependencies
  const edges: any[] = []
  tree.nodes.forEach(node => {
    if (node.dependsOn && node.dependsOn.length > 0) {
      node.dependsOn.forEach(depId => {
        edges.push({
          id: `e-${depId}-${node.id}`,
          source: depId,
          target: node.id,
          style: { stroke: '#ff6b00', strokeWidth: 2 }
        })
      })
    }
  })

  return { tree: { id: tree.id, title: tree.title, description: tree.description }, nodes: formattedNodes, edges }
}

export async function getAllSkillTrees(userId: string) {
  const trees = await prisma.skillTree.findMany({
    include: {
      nodes: {
        include: {
          progress: {
            where: { userId }
          }
        }
      }
    }
  })
  
  if (trees.length === 0) {
    await syncCoursesFromContent()
    return getAllSkillTrees(userId)
  }
  
  return trees.map(tree => {
    const totalNodes = tree.nodes.length
    const completedNodes = tree.nodes.filter(n => n.progress.length > 0 && n.progress[0].status === 'COMPLETED').length
    return {
      id: tree.id,
      title: tree.title,
      description: tree.description,
      totalNodes,
      completedNodes
    }
  })
}

export async function unlockNode(userId: string, nodeId: string) {
  return prisma.skillProgress.upsert({
    where: { userId_nodeId: { userId, nodeId } },
    update: { status: "UNLOCKED" },
    create: { userId, nodeId, status: "UNLOCKED" }
  })
}

export async function completeNode(userId: string, nodeId: string) {
  const completed = await prisma.skillProgress.upsert({
    where: { userId_nodeId: { userId, nodeId } },
    update: { status: "COMPLETED", completedAt: new Date() },
    create: { userId, nodeId, status: "COMPLETED", completedAt: new Date() }
  })
  
  // Find dependent nodes and unlock them if requirements are met
  // This is a simplified auto-unlock for the next nodes in line
  const node = await prisma.skillNode.findUnique({ where: { id: nodeId } })
  if (node) {
    const dependentNodes = await prisma.skillNode.findMany({
      where: { dependsOn: { has: nodeId } }
    })
    
    for (const dNode of dependentNodes) {
      // In a real strict implementation, you'd verify ALL dependencies are completed
      await unlockNode(userId, dNode.id)
    }
  }
  
  return completed
}

export async function syncCoursesFromContent() {
  const contentDir = path.join(__dirname, '../content/courses')
  if (!fs.existsSync(contentDir)) return

  const files = fs.readdirSync(contentDir).filter(f => f.endsWith('.json'))

  for (const file of files) {
    const rawData = fs.readFileSync(path.join(contentDir, file), 'utf-8')
    const courseData = JSON.parse(rawData)

    // Upsert the Tree
    await prisma.skillTree.upsert({
      where: { id: courseData.id },
      update: {
        title: courseData.title,
        description: courseData.description,
      },
      create: {
        id: courseData.id,
        title: courseData.title,
        description: courseData.description,
      }
    })

    // Upsert all nodes for this tree
    for (const nodeData of courseData.nodes) {
      await prisma.skillNode.upsert({
        where: { id: nodeData.id },
        update: {
          title: nodeData.title,
          description: nodeData.description,
          type: nodeData.type,
          xPos: nodeData.xPos,
          yPos: nodeData.yPos,
          dependsOn: nodeData.dependsOn,
          problemSlug: nodeData.problemSlug || null,
        },
        create: {
          id: nodeData.id,
          treeId: courseData.id,
          title: nodeData.title,
          description: nodeData.description,
          type: nodeData.type,
          xPos: nodeData.xPos,
          yPos: nodeData.yPos,
          dependsOn: nodeData.dependsOn,
          problemSlug: nodeData.problemSlug || null,
        }
      })
    }
  }
}

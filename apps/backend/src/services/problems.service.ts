import { prisma } from "@devforge/database"


export async function getProblems(
  difficulty?: string,
  category?: string,
  page = 1,
  limit = 10
) {
  const skip = (page - 1) * limit
  const where: any = {}
  if (difficulty) where.difficulty = difficulty.toUpperCase()
  if (category) where.category = { contains: category, mode: "insensitive" }

  const [problems, total] = await Promise.all([
    prisma.problem.findMany({
      where,
      orderBy: { order: "asc" },
      skip,
      take: limit,
      select: {
        id: true,
        title: true,
        slug: true,
        difficulty: true,
        category: true,
        order: true,
      },
    }),
    prisma.problem.count({ where }),
  ])

  return {
    problems,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  }
}

export async function getRecommendedProblems(userId: string) {
  // Get all problems the user has solved
  const solved = await prisma.submission.findMany({
    where: { userId, status: "accepted" },
    select: { problemId: true },
  })
  
  const solvedIds = solved.map(s => s.problemId)
  
  // Find up to 3 problems they haven't solved yet
  const recommendations = await prisma.problem.findMany({
    where: {
      id: { notIn: solvedIds }
    },
    take: 3,
    orderBy: { order: "asc" },
    select: {
      id: true,
      title: true,
      slug: true,
      difficulty: true,
      category: true,
    }
  })
  
  // If they somehow solved everything, just return the first 3 problems
  if (recommendations.length === 0) {
    return prisma.problem.findMany({
      take: 3,
      orderBy: { order: "asc" },
      select: {
        id: true,
        title: true,
        slug: true,
        difficulty: true,
        category: true,
      }
    })
  }
  
  return recommendations
}

export async function getProblemBySlug(slug: string, mode?: string) {
  const problem = await prisma.problem.findUnique({
    where: { slug },
    select: { id: true, title: true, slug: true, description: true, category: true, difficulty: true, examples: true, constraints: true, starterCode: true }
  })
  
  if (!problem) return null;

  if (mode === 'anvil') {
    // Inject broken code depending on the slug
    if (slug === 'two-sum') {
      problem.starterCode = {
        javascript: `function twoSum(nums, target) {\n  // Junior Dev: "I think this O(N^2) approach will work... right?"\n  for (let i = 0; i <= nums.length; i++) { // BUG: i <= nums.length\n    for (let j = 1; j < nums.length; j++) { // BUG: j starts at 1, should be i + 1\n      if (nums[i] + nums[j] == target) {\n        return [i, j];\n      }\n    }\n  }\n  return [];\n}`,
        python: `def twoSum(nums, target):\n    # Junior Dev: "I think this O(N^2) approach will work... right?"\n    for i in range(len(nums) + 1): # BUG: out of bounds\n        for j in range(1, len(nums)): # BUG: starts at 1 instead of i+1\n            if nums[i] + nums[j] == target:\n                return [i, j]\n    return []`
      }
    } else if (slug === 'maximum-subarray') {
      problem.starterCode = {
        javascript: `function maxSubArray(nums) {\n  // Junior Dev: "Let's keep a running sum!"\n  let maxSum = 0; // BUG: Should be -Infinity or nums[0]\n  let currentSum = 0;\n  \n  for (let i = 0; i < nums.length; i++) {\n    currentSum += nums[i];\n    if (currentSum > maxSum) {\n      maxSum = currentSum;\n    }\n    if (currentSum < 0) {\n      currentSum = 1; // BUG: Should reset to 0\n    }\n  }\n  \n  return maxSum;\n}`,
        python: `def maxSubArray(nums):\n    # Junior Dev: "Let's keep a running sum!"\n    maxSum = 0 # BUG: Should be float('-inf') or nums[0]\n    currentSum = 0\n    \n    for i in range(len(nums)):\n        currentSum += nums[i]\n        if currentSum > maxSum:\n            maxSum = currentSum\n        if currentSum < 0:\n            currentSum = 1 # BUG: Should reset to 0\n            \n    return maxSum`
      }
    } else {
      problem.starterCode = {
        javascript: `// ANVIL: This code has a bug you need to fix!\n\n` + (problem.starterCode as any).javascript,
        python: `# ANVIL: This code has a bug you need to fix!\n\n` + (problem.starterCode as any).python
      }
    }
  }

  return problem;
}

export async function submitSolution(
  userId: string,
  problemId: string,
  code: string,
  language: string,
  nodeId?: string
) {
  if (code.length > 100_000) {
    throw Object.assign(new Error("Payload too large"), { statusCode: 413 })
  }

  const problem = await prisma.problem.findUnique({ where: { id: problemId } })
  if (!problem) throw new Error("Problem not found")

  const { executeCode } = await import("./piston.service")
  const testCases = problem.testCases as { input: string; expected: string }[]
  let allPassed = true
  const results = new Array(testCases.length)

  const wrappedCode = buildCode(code, language, testCases.map(tc => tc.input), problem.slug)
  
  try {
    const pistonRes = await executeCode(language, wrappedCode)
    const { stdout, stderr, signal } = pistonRes.run
    const timedOut = signal === "SIGKILL"
    
    if (timedOut) {
      allPassed = false
      for (let i = 0; i < testCases.length; i++) {
        results[i] = {
          input: testCases[i].input,
          expected: testCases[i].expected,
          output: "Time Limit Exceeded",
          passed: false,
          stderr: null,
        }
      }
    } else {
      let runResults: any[] = []
      try {
        runResults = JSON.parse(stdout.trim().split("\n").pop() || "[]")
      } catch (e) {
        // Fallback if stdout couldn't be parsed as JSON
        allPassed = false
        for (let i = 0; i < testCases.length; i++) {
          results[i] = {
            input: testCases[i].input,
            expected: testCases[i].expected,
            output: "Output Parsing Error",
            passed: false,
            stderr: stderr || stdout || "Invalid JSON output from runner",
          }
        }
        runResults = null as any
      }

      if (runResults) {
        for (let i = 0; i < testCases.length; i++) {
          const tc = testCases[i]
          const res = runResults[i]
          if (!res) {
            allPassed = false
            results[i] = { input: tc.input, expected: tc.expected, output: "Missing output", passed: false, stderr: null }
            continue
          }
          if (!res.success) {
            allPassed = false
            results[i] = { input: tc.input, expected: tc.expected, output: "Execution Error", passed: false, stderr: res.error }
            continue
          }
          
          const output = String(res.output).trim()
          const passed = output === String(tc.expected).trim()
          if (!passed) allPassed = false
          
          results[i] = { input: tc.input, expected: tc.expected, output, passed, stderr: null }
        }
      }
    }
  } catch (e: any) {
    allPassed = false
    for (let i = 0; i < testCases.length; i++) {
      results[i] = {
        input: testCases[i].input,
        expected: testCases[i].expected,
        output: "Execution Error",
        passed: false,
        stderr: e.message,
      }
    }
  }

  const lastSubmission = await prisma.submission.findFirst({
    where: { userId, problemId },
    orderBy: { createdAt: "desc" },
  })

  let submission = lastSubmission;
  if (!lastSubmission || lastSubmission.code !== code || lastSubmission.language !== language) {
    submission = await prisma.submission.create({
      data: {
        userId,
        problemId,
        code,
        language,
        status: allPassed ? "accepted" : "wrong_answer",
        runtime: null,
        memory: null,
      },
    })
  }

  if (allPassed && nodeId) {
    const node = await prisma.skillNode.findUnique({ where: { id: nodeId } })
    if (node && node.problemSlug === problem.slug) {
      const isRoot = !node.dependsOn || node.dependsOn.length === 0;
      let canComplete = isRoot;
      if (!isRoot) {
        const progress = await prisma.skillProgress.findUnique({ where: { userId_nodeId: { userId, nodeId } } })
        if (progress && (progress.status === "UNLOCKED" || progress.status === "COMPLETED")) {
          canComplete = true;
        }
      }
      if (canComplete) {
        const { completeNode } = await import("./learn.service")
        await completeNode(userId, nodeId)
      }
    }
  }

  return { submission, results, allPassed }
}

const RUNNER_REGISTRY: Record<string, { javascript?: string, python?: string }> = {
  "two-sum": {
    javascript: `const nums = JSON.parse(lines[0]); const target = parseInt(lines[1]); result = JSON.stringify(twoSum(nums, target));`,
    python: `nums = json.loads(lines[0]); target = int(lines[1]); result = json.dumps(two_sum(nums, target), separators=(',', ':'))`,
  },
  "valid-parentheses": {
    javascript: `result = isValid(lines[0]) ? "true" : "false";`,
    python: `result = "true" if is_valid(lines[0]) else "false"`,
  },
  "maximum-subarray": {
    javascript: `const nums = JSON.parse(lines[0]); result = String(maxSubArray(nums));`,
    python: `nums = json.loads(lines[0]); result = str(max_sub_array(nums))`,
  },
  "climbing-stairs": {
    javascript: `result = String(climbStairs(parseInt(lines[0])));`,
    python: `result = str(climb_stairs(int(lines[0])))`,
  },
  "binary-search": {
    javascript: `const nums = JSON.parse(lines[0]); const target = parseInt(lines[1]); result = String(search(nums, target));`,
    python: `nums = json.loads(lines[0]); target = int(lines[1]); result = str(search(nums, target))`,
  },
  "number-of-islands": {
    javascript: `const grid = JSON.parse(lines[0]); result = String(numIslands(grid));`,
    python: `grid = json.loads(lines[0]); result = str(num_islands(grid))`,
  },
  "longest-palindromic-substring": {
    javascript: `result = longestPalindrome(lines[0]);`,
    python: `result = longest_palindrome(lines[0])`,
  },
  "word-search": {
    javascript: `const board = JSON.parse(lines[0]); const word = lines[1]; result = exist(board, word) ? "true" : "false";`,
    python: `board = json.loads(lines[0]); word = lines[1]; result = "true" if exist(board, word) else "false"`,
  },
  "reverse-linked-list": {
    javascript: `const head = toList(JSON.parse(lines[0])); result = JSON.stringify(fromList(reverseList(head)));`,
    python: `head = to_list(json.loads(lines[0])); result = json.dumps(from_list(reverseList(head)), separators=(',', ':'))`,
  },
  "merge-two-sorted-lists": {
    javascript: `const l1 = toList(JSON.parse(lines[0])); const l2 = toList(JSON.parse(lines[1])); result = JSON.stringify(fromList(mergeTwoLists(l1, l2)));`,
    python: `l1 = to_list(json.loads(lines[0])); l2 = to_list(json.loads(lines[1])); result = json.dumps(from_list(mergeTwoLists(l1, l2)), separators=(',', ':'))`,
  }
}

function buildCode(
  code: string,
  language: string,
  testCases: string[],
  slug: string
): string {
  const runnerDef = RUNNER_REGISTRY[slug];
  if (!runnerDef) throw new Error(`No runner configured for problem ${slug}`)
  
  if (language === "javascript") {
    const runner = runnerDef.javascript;
    if (!runner) throw new Error(`No Javascript runner for problem ${slug}`)
    return `
// Hijack stdout so user logs don't interfere with the judge result
const _out = process.stdout.write.bind(process.stdout);
process.stdout.write = process.stderr.write.bind(process.stderr);
if (typeof console !== 'undefined') {
  console.log = (...args) => process.stderr.write(args.join(" ") + "\\n");
  console.info = console.log;
}

class ListNode {
  constructor(val = 0, next = null) {
    this.val = val;
    this.next = next;
  }
}
function toList(arr) {
  if (!arr || !arr.length) return null;
  const head = new ListNode(arr[0]);
  let curr = head;
  for(let i=1; i<arr.length; i++){
    curr.next = new ListNode(arr[i]);
    curr = curr.next;
  }
  return head;
}
function fromList(head) {
  const arr = [];
  let curr = head;
  while(curr && arr.length < 1000) { arr.push(curr.val); curr = curr.next; }
  return arr;
}

\${code}

const testCases = ${JSON.stringify(testCases)};
const results = [];
for (let i = 0; i < testCases.length; i++) {
  const lines = testCases[i].split("\\n");
  try {
    let result;
    ${runner}
    results.push({ success: true, output: String(result) });
  } catch (e) {
    results.push({ success: false, error: e.message });
  }
}
_out(JSON.stringify(results) + "\\n");
`
  }

  if (language === "python") {
    const runner = runnerDef.python;
    if (!runner) throw new Error(`No Python runner for problem ${slug}`)
    return `
import json, sys

class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def to_list(arr):
    if not arr: return None
    head = ListNode(arr[0])
    curr = head
    for i in range(1, len(arr)):
        curr.next = ListNode(arr[i])
        curr = curr.next
    return head

def from_list(head):
    arr = []
    curr = head
    while curr and len(arr) < 1000:
        arr.append(curr.val)
        curr = curr.next
    return arr

# Hijack standard output
_real_stdout = sys.stdout
sys.stdout = sys.stderr

${code}

sys.stdout = _real_stdout
testCases = ${JSON.stringify(testCases)}
results = []
for testCase in testCases:
    lines = testCase.strip().split("\\n")
    try:
        ${runner}
        results.append({"success": True, "output": str(result)})
    except Exception as e:
        results.append({"success": False, "error": str(e)})

_real_stdout.write(json.dumps(results) + "\\n")
`
  }

  throw new Error("Unsupported language")
}
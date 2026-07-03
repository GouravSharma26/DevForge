import { PrismaClient } from "@prisma/client"
import { runInSandbox } from "../utils/sandbox"

const prisma = new PrismaClient()

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

export async function getProblemBySlug(slug: string) {
  return prisma.problem.findUnique({ where: { slug } })
}

export async function submitSolution(
  userId: string,
  problemId: string,
  code: string,
  language: string
) {
  const problem = await prisma.problem.findUnique({ where: { id: problemId } })
  if (!problem) throw new Error("Problem not found")

  const testCases = problem.testCases as { input: string; expected: string }[]
  const results = []
  let allPassed = true

  for (const testCase of testCases) {
    const wrappedCode = buildCode(code, language, testCase.input, problem.slug)

    const { stdout, stderr, timedOut } = await runInSandbox(wrappedCode, language)

    if (timedOut) {
      allPassed = false
      results.push({
        input: testCase.input,
        expected: testCase.expected,
        output: "Time Limit Exceeded",
        passed: false,
        stderr: null,
      })
      continue
    }

    const output = stdout || stderr
    const passed = output === testCase.expected
    if (!passed) allPassed = false

    results.push({
      input: testCase.input,
      expected: testCase.expected,
      output,
      passed,
      stderr: stderr || null,
    })
  }

  const submission = await prisma.submission.create({
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

  return { submission, results, allPassed }
}

function buildCode(
  code: string,
  language: string,
  input: string,
  slug: string
): string {
  if (language === "javascript") {
    return `
${code}

const lines = ${JSON.stringify(input)}.split("\\n");
try {
  let result;
  ${getJSRunner(slug)}
  console.log(result);
} catch (e) {
  console.error(e.message);
}
`
  }

  if (language === "python") {
    return `
import json, sys

${code}

lines = ${JSON.stringify(input)}.strip().split("\\n")
try:
    ${getPyRunner(slug)}
    print(result, end="")
except Exception as e:
    sys.stderr.write(str(e))
`
  }

  return code
}

function getJSRunner(slug: string): string {
  const map: Record<string, string> = {
    "two-sum":
      `const nums = JSON.parse(lines[0]); const target = parseInt(lines[1]); result = JSON.stringify(twoSum(nums, target));`,
    "valid-parentheses":
      `result = isValid(lines[0]) ? "true" : "false";`,
    "maximum-subarray":
      `const nums = JSON.parse(lines[0]); result = String(maxSubArray(nums));`,
    "climbing-stairs":
      `result = String(climbStairs(parseInt(lines[0])));`,
    "binary-search":
      `const nums = JSON.parse(lines[0]); const target = parseInt(lines[1]); result = String(search(nums, target));`,
    "number-of-islands":
      `const grid = JSON.parse(lines[0]); result = String(numIslands(grid));`,
    "longest-palindromic-substring":
      `result = longestPalindrome(lines[0]);`,
    "word-search":
      `const board = JSON.parse(lines[0]); const word = lines[1]; result = exist(board, word) ? "true" : "false";`,
    "reverse-linked-list":
      `result = "[]";`,
    "merge-two-sorted-lists":
      `result = "[]";`,
  }
  return map[slug] ?? `result = "No runner configured";`
}

function getPyRunner(slug: string): string {
  const map: Record<string, string> = {
    "two-sum":
     `nums = json.loads(lines[0]); target = int(lines[1]); result = json.dumps(two_sum(nums, target), separators=(',', ':'))`,
    "valid-parentheses":
      `result = "true" if is_valid(lines[0]) else "false"`,
    "maximum-subarray":
      `nums = json.loads(lines[0]); result = str(max_sub_array(nums))`,
    "climbing-stairs":
      `result = str(climb_stairs(int(lines[0])))`,
    "binary-search":
      `nums = json.loads(lines[0]); target = int(lines[1]); result = str(search(nums, target))`,
    "longest-palindromic-substring":
      `result = longest_palindrome(lines[0])`,
    "number-of-islands":
      `grid = json.loads(lines[0]); result = str(num_islands(grid))`,
    "word-search":
      `board = json.loads(lines[0]); word = lines[1]; result = "true" if exist(board, word) else "false"`,
  }
  return map[slug] ?? `result = "No runner configured"`
}
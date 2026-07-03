import { prisma } from "@devforge/database"

const PISTON_URL = "https://emkc.org/api/v2/piston"

const LANGUAGE_MAP: Record<string, { language: string; version: string }> = {
  javascript: { language: "node", version: "18.15.0" },
  python: { language: "python", version: "3.10.0" },
}

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

  const lang = LANGUAGE_MAP[language]
  if (!lang) throw new Error(`Unsupported language: ${language}`)

  for (const testCase of testCases) {
    const wrappedCode = wrapCode(code, language, testCase.input, problem.slug)

    try {
      const res = await fetch(`${PISTON_URL}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: lang.language,
          version: lang.version,
          files: [{ name: "solution", content: wrappedCode }],
          stdin: testCase.input,
        }),
      })

      const data = await res.json() as any
      const output = (data.run?.stdout || data.run?.stderr || "").trim()
      const passed = output === testCase.expected

      if (!passed) allPassed = false

      results.push({
        input: testCase.input,
        expected: testCase.expected,
        output,
        passed,
        time: data.run?.time || null,
        stderr: data.run?.stderr || null,
      })
    } catch (err) {
      allPassed = false
      results.push({
        input: testCase.input,
        expected: testCase.expected,
        output: "Execution error",
        passed: false,
        time: null,
        stderr: String(err),
      })
    }
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

function wrapCode(code: string, language: string, input: string, slug: string): string {
  if (language === "javascript") {
    return `
${code}

const lines = \`${input.replace(/`/g, "\\`")}\`.split('\\n');
try {
  let result;
  ${getJSTestRunner(slug)}
  process.stdout.write(String(result));
} catch(e) {
  process.stderr.write(e.message);
}
`
  }

  if (language === "python") {
    return `
${code}

import sys
import json

lines = """${input}""".strip().split('\\n')
try:
  ${getPythonTestRunner(slug)}
  print(result, end='')
except Exception as e:
  sys.stderr.write(str(e))
`
  }

  return code
}

function getJSTestRunner(slug: string): string {
  const runners: Record<string, string> = {
    "two-sum": `const nums = JSON.parse(lines[0]); const target = parseInt(lines[1]); result = JSON.stringify(twoSum(nums, target));`,
    "valid-parentheses": `result = isValid(lines[0]) ? 'true' : 'false';`,
    "maximum-subarray": `const nums = JSON.parse(lines[0]); result = maxSubArray(nums);`,
    "climbing-stairs": `result = climbStairs(parseInt(lines[0]));`,
    "binary-search": `const nums = JSON.parse(lines[0]); const target = parseInt(lines[1]); result = search(nums, target);`,
    "number-of-islands": `const grid = JSON.parse(lines[0]); result = numIslands(grid);`,
    "longest-palindromic-substring": `result = longestPalindrome(lines[0]);`,
    "word-search": `const board = JSON.parse(lines[0]); const word = lines[1]; result = exist(board, word) ? 'true' : 'false';`,
    "reverse-linked-list": `result = JSON.stringify([]);`,
    "merge-two-sorted-lists": `result = JSON.stringify([]);`,
  }
  return runners[slug] || `result = "No runner configured";`
}

function getPythonTestRunner(slug: string): string {
  const runners: Record<string, string> = {
    "two-sum": `nums = json.loads(lines[0]); target = int(lines[1]); result = json.dumps(two_sum(nums, target))`,
    "valid-parentheses": `result = 'true' if is_valid(lines[0]) else 'false'`,
    "maximum-subarray": `nums = json.loads(lines[0]); result = max_sub_array(nums)`,
    "climbing-stairs": `result = climb_stairs(int(lines[0]))`,
    "binary-search": `nums = json.loads(lines[0]); target = int(lines[1]); result = search(nums, target)`,
    "longest-palindromic-substring": `result = longest_palindrome(lines[0])`,
  }
  return runners[slug] || `result = "No runner configured"`
}
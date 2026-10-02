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

export async function getProblemBySlug(slug: string) {
  return prisma.problem.findUnique({
    where: { slug },
    select: { id: true, title: true, slug: true, description: true, category: true, difficulty: true, examples: true, constraints: true, starterCode: true }
  })
}

export async function submitSolution(
  userId: string,
  problemId: string,
  code: string,
  language: string
) {
  const problem = await prisma.problem.findUnique({ where: { id: problemId } })
  if (!problem) throw new Error("Problem not found")

  const { executeCode } = await import("./piston.service")
  const testCases = problem.testCases as { input: string; expected: string }[]
  let allPassed = true
  const results = new Array(testCases.length)

  // Bounded concurrency execution against Piston (limit: 5)
  const CONCURRENCY_LIMIT = 5;
  let activePromises = 0;
  let queueIndex = 0;

  const runTestCase = async (index: number) => {
    const testCase = testCases[index];
    const wrappedCode = buildCode(code, language, testCase.input, problem.slug);
    const examples = problem.examples as { input: string }[];
    const isExample = examples.some((ex: any) => ex.input === testCase.input);
    const expectedOutput = isExample ? testCase.expected : undefined;
    
    try {
      const pistonRes = await executeCode(language, wrappedCode);
      const { stdout, stderr, signal } = pistonRes.run;
      const timedOut = signal === "SIGKILL";

      if (timedOut) {
        allPassed = false;
        results[index] = {
          input: testCase.input,
          expected: expectedOutput,
          output: "Time Limit Exceeded",
          passed: false,
          stderr: null,
        };
        return;
      }

      const output = (stdout || stderr).trim();
      const passed = output === testCase.expected.trim();
      if (!passed) allPassed = false;

      results[index] = {
        input: testCase.input,
        expected: expectedOutput,
        output,
        passed,
        stderr: stderr || null,
      };
    } catch (e: any) {
      allPassed = false;
      results[index] = {
        input: testCase.input,
        expected: expectedOutput,
        output: "Execution Error",
        passed: false,
        stderr: e.message,
      };
    }
  };

  const workers = [];
  for (let i = 0; i < CONCURRENCY_LIMIT; i++) {
    workers.push(
      (async () => {
        while (queueIndex < testCases.length) {
          const currentIndex = queueIndex++;
          await runTestCase(currentIndex);
        }
      })()
    );
  }

  await Promise.all(workers);

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
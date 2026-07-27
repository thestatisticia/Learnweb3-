/**
 * Compile LearnWeb3Progress.sol with solc
 */
import solc from "solc";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const sourcePath = resolve("contracts/LearnWeb3Progress.sol");
const source = readFileSync(sourcePath, "utf8");

const input = {
  language: "Solidity",
  sources: {
    "LearnWeb3Progress.sol": { content: source },
  },
  settings: {
    optimizer: { enabled: true, runs: 200 },
    outputSelection: {
      "*": {
        "*": ["abi", "evm.bytecode.object"],
      },
    },
  },
};

const output = JSON.parse(solc.compile(JSON.stringify(input)));

if (output.errors?.length) {
  for (const err of output.errors) {
    console[err.severity === "error" ? "error" : "warn"](err.formattedMessage);
  }
  if (output.errors.some((e) => e.severity === "error")) process.exit(1);
}

const contract = output.contracts["LearnWeb3Progress.sol"]["LearnWeb3Progress"];
mkdirSync(resolve("src/lib/abi"), { recursive: true });
mkdirSync(resolve("artifacts"), { recursive: true });

const artifact = {
  contractName: "LearnWeb3Progress",
  abi: contract.abi,
  bytecode: `0x${contract.evm.bytecode.object}`,
};

writeFileSync(
  resolve("artifacts/LearnWeb3Progress.json"),
  JSON.stringify(artifact, null, 2),
);
writeFileSync(
  resolve("src/lib/abi/LearnWeb3Progress.json"),
  JSON.stringify({ abi: contract.abi }, null, 2),
);

console.log("Compiled LearnWeb3Progress");
console.log("Bytecode bytes:", contract.evm.bytecode.object.length / 2);

/**
 * Compile LearnWeb3 Solidity contracts with solc
 */
import solc from "solc";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const CONTRACTS = [
  { file: "LearnWeb3Progress.sol", name: "LearnWeb3Progress" },
  { file: "LearnWeb3Badge.sol", name: "LearnWeb3Badge" },
  { file: "LearnTokenSwap.sol", name: "LearnTokenSwap" },
];

const sources = {};
for (const { file } of CONTRACTS) {
  sources[file] = { content: readFileSync(resolve("contracts", file), "utf8") };
}

const input = {
  language: "Solidity",
  sources,
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

mkdirSync(resolve("src/lib/abi"), { recursive: true });
mkdirSync(resolve("artifacts"), { recursive: true });

for (const { file, name } of CONTRACTS) {
  const contract = output.contracts[file][name];
  const artifact = {
    contractName: name,
    abi: contract.abi,
    bytecode: `0x${contract.evm.bytecode.object}`,
  };

  writeFileSync(resolve(`artifacts/${name}.json`), JSON.stringify(artifact, null, 2));
  writeFileSync(
    resolve(`src/lib/abi/${name}.json`),
    JSON.stringify({ abi: contract.abi }, null, 2),
  );

  console.log(`Compiled ${name}`);
  console.log("Bytecode bytes:", contract.evm.bytecode.object.length / 2);
}

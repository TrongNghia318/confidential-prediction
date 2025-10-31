import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log("Deploying ConfidentialPrediction with account:", deployer);

  const prediction = await deploy("ConfidentialPrediction", {
    from: deployer,
    args: [],
    log: true,
    waitConfirmations: 1,
  });

  console.log("✅ ConfidentialPrediction deployed to:", prediction.address);
};

export default func;
func.tags = ["ConfidentialPrediction"];

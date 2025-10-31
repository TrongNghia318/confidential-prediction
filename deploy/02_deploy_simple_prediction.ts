import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log("Deploying SimplePrediction with account:", deployer);

  const prediction = await deploy("SimplePrediction", {
    from: deployer,
    args: [],
    log: true,
    waitConfirmations: 1,
  });

  console.log("✅ SimplePrediction deployed to:", prediction.address);
};

export default func;
func.tags = ["SimplePrediction"];

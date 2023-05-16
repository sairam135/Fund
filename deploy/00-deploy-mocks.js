
const {network} = require("hardhat")
const {developmentChains, DECIMALS, INITIAL_ANSWER} = require("../helper-hardhat-config")
module.exports  = async ({getNamedAccounts, deployments}) => {
    const { deploy, log }= deployments
    log("Starting deployment of Mocks.....")
    const  { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId   
    if (developmentChains.includes(network.name)){
        log("Local network detected! Deployig mocks...")
        await deploy("MockV3Aggregator",{
            contract: "MockV3Aggregator",
            from: deployer,
            log: true,
            args: [DECIMALS, INITIAL_ANSWER]
        })
    }
    log("-----------------------------------------------------------")
}

module.exports.tags = ["all", "mocks"]

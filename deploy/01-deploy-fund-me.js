const {network} = require("hardhat")
const {networkConfig, developmentChains} = require("../helper-hardhat-config")
require("dotenv").config()
const { verify } = require("../utils/verify")
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY

module.exports  = async ({getNamedAccounts, deployments}) => {
    const { deploy, log }= deployments
    log("Starting deployment of FundMe.....")
    const  { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId   

    let ethUsdPriceFeedAddress 
    if(developmentChains.includes(network.name)){
        const ethUsdPriceFeed = await deployments.get("MockV3Aggregator")
        ethUsdPriceFeedAddress = ethUsdPriceFeed.address
    }
    else{
        ethUsdPriceFeedAddress = networkConfig[network.config.chainId]["ethUsdPriceFeed"]
    }
    const args = [ethUsdPriceFeedAddress]
    const fundMe = await deploy("FundMe", {
        from: deployer,
        args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1
    })

    if(!developmentChains.includes(network.name) && ETHERSCAN_API_KEY){
        await verify(fundMe.address, args)
    }

    log("Fund Me deployed!")
    log("-----------------------------------------------------------")
}
module.exports.tags = ["all", "fundme"]
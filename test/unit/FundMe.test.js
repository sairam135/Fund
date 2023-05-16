const { deployments, network, ethers, getNamedAccounts } = require("hardhat")
const { assert, expect } = require("chai")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", async function(){
        let fundMe
        let deployer
        let mockV3Aggregator
        const sendValue = "1000000000000000000"
        beforeEach(async function (){
            deployer = (await getNamedAccounts()).deployer
            await deployments.fixture(["all"])
            fundMe = await ethers.getContract("FundMe", deployer)
            mockV3Aggregator = await ethers.getContract("MockV3Aggregator", deployer)
        })
    
        describe("Constructor", async function(){
            it("Sets the aggregator addresses correctly ", async function(){
                const response = await fundMe.getPriceFeed()
                assert.equal(response, mockV3Aggregator.address)
            })
        })
        
        describe("fund", async function () {
            it("Fails if you don't send enough ETH", async function() {
                await expect(fundMe.fund()).to.be.revertedWith('You need to spend more ETH!')
            })
    
            it("updated the amount funded data structure", async function() {
                await fundMe.fund({value: sendValue})
                const response = await fundMe.getAddressToAmountFunded(deployer)
                assert.equal(response.toString(), sendValue)
            })
    
            it("Adds funder to array of funders", async function() {
                await fundMe.fund({value: sendValue})
                const response = await fundMe.getFunders(0)
                assert.equal(response, deployer)
            })
        })
    
        describe("withdraw", async function () {
    
            beforeEach(async function () {
                await fundMe.fund({value: sendValue})
            })
    
            it("withdraw ETH from a single founder", async function () {
                const intialFundBalance      = await fundMe.provider.getBalance(fundMe.address)
                const initialDeployerBalance = await fundMe.provider.getBalance(deployer)
                const transactionResponse    = await fundMe.withdraw()
                const transactionReceipt     = await transactionResponse.wait(1)
                const {gasUsed, effectiveGasPrice} = transactionReceipt
                const gasCost = gasUsed.mul(effectiveGasPrice)
                const finalFundBalance       = await fundMe.provider.getBalance(fundMe.address)
                const endingDeployerBalance  = await fundMe.provider.getBalance(deployer)
                assert.equal(finalFundBalance, 0)
                assert.equal(intialFundBalance.add(initialDeployerBalance).toString(), endingDeployerBalance.add(gasCost).toString())
            })
    
            it("allows us to withdraw with multiple founders", async function () {
                const accounts = await ethers.getSigners()
                for(let i=1; i<6; i++){
                    const fundMeConnectedContract = await fundMe.connect(accounts[i])
                    await fundMeConnectedContract.fund({value: sendValue})
                }
                const intialFundBalance      = await fundMe.provider.getBalance(fundMe.address)
                const initialDeployerBalance = await fundMe.provider.getBalance(deployer)
                const transactionResponse    = await fundMe.withdraw()
                const transactionReceipt     = await transactionResponse.wait(1)
                const {gasUsed, effectiveGasPrice} = transactionReceipt
                const gasCost = gasUsed.mul(effectiveGasPrice)
                const finalFundBalance       = await fundMe.provider.getBalance(fundMe.address)
                const endingDeployerBalance  = await fundMe.provider.getBalance(deployer)
                assert.equal(finalFundBalance, 0)
                assert.equal(intialFundBalance.add(initialDeployerBalance).toString(), endingDeployerBalance.add(gasCost).toString())
                
                await expect(fundMe.getFunders(0)).to.be.reverted
    
                for(let i = 1; i<6 ; i++ ){
                    assert.equal(await fundMe.getAddressToAmountFunded(accounts[i].address), 0)
                }
    
            })
    
            it("Only allows to withdraw", async function () {
                const accounts = await ethers.getSigners()
                const attacker = accounts[1]
                const attackerConnectedContract = await fundMe.connect(attacker)
                await expect(attackerConnectedContract.withdraw()).to.be.reverted
            })
        })
    
    })

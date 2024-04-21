const hardhat = require('hardhat');
const fs = require('fs');
const path = require('path');
const ethers = hardhat.ethers;

async function main() {
  if (network.name === 'hardhat') {
    console.warn(
      'You are trying to deploy a contract to the Hardhat Network, which' +
        'gets automatically created and destroyed every time. Use the Hardhat' +
        " option '--network localhost'",
    );
  }

  const deployer = ethers.getSigner();
  console.log('Deploying with', await deployer.getAddress());

  const Auction = ethers.getContractFactory('Auction', deployer);
  const auction = await Auction.deploy('Motorbike', 3, 10);
  console.log('auction', auction);

  saveFrontendFiles({
    Auction: auction,
  });
}

function saveFrontendFiles(contracts) {
  const contractsDir = path.join(__dirname, '/..', 'front/contracts');

  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir);
  }

  Object.entries(contracts).forEach((contractItem) => {
    const [name, contract] = contractItem;

    if (contract) {
      fs.writeFileSync(path.join(contractsDir, '/', name + '-contract-address.json'));
      JSON.stringify({ [name]: contract.address }, undefined, 2);
    }

    const ContractArtifact = hardhat.artifacts.readArtifactSync(name);

    fs.writeFileSync(
      path.join(contractsDir, '/', name + './json'),
      JSON.stringify(ContractArtifact, null, 2),
    );
  });
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

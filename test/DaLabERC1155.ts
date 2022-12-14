import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { Contract } from "ethers";
import { ethers } from "hardhat";

describe("DaLabERC1155", function () {
  let badgeContract: Contract,
    owner: SignerWithAddress,
    alice: SignerWithAddress,
    bob: SignerWithAddress

  beforeEach(async () => {
    [owner, alice, bob] = await ethers.getSigners();
    const DaLabERC1155 = await ethers.getContractFactory("DaLabERC1155");
    badgeContract = await DaLabERC1155.deploy();
    await badgeContract.deployed();
  });

  describe("createBadge", () => {
    it("creates badges", async () => {
      const badgeArgs = {
        mintable: true,
        transferable: false,
        maxSupply: 10,
        tokenURI: "https://example.com",
        maxMintPerWallet: 0,
      };

      await expect(badgeContract.createBadge(badgeArgs))
        .to.emit(badgeContract, "NewBadge")
        .withArgs(1, badgeArgs.mintable);
      const badge = await badgeContract.badges(1);
      expect(badge.mintable).to.eq(badgeArgs.mintable);
      expect(badge.transferable).to.eq(badgeArgs.transferable);
      expect(badge.tokenURI).to.eq(badgeArgs.tokenURI);
      expect(badge.maxSupply).to.eq(badgeArgs.maxSupply);

      await expect(badgeContract.createBadge(Object.values(badgeArgs)))
        .to.emit(badgeContract, "NewBadge")
        .withArgs(2, badgeArgs.mintable);
      const anotherBadge = await badgeContract.badges(2);
      expect(anotherBadge.mintable).to.eq(badgeArgs.mintable);
      expect(anotherBadge.transferable).to.eq(badgeArgs.transferable);
      expect(anotherBadge.tokenURI).to.eq(badgeArgs.tokenURI);
      expect(anotherBadge.maxSupply).to.eq(badgeArgs.maxSupply);
    });

    it("reverts with none owner", async () => {
      const badgeArgs = {
        mintable: true,
        transferable: false,
        maxSupply: 10,
        tokenURI: "https://example.com",
        maxMintPerWallet: 0,
      };

      await expect(badgeContract.connect(alice).createBadge(badgeArgs)).to.be
        .reverted;
    });
  });

  describe("lockMinting", () => {
    it("reverts if badge is locked", async () => {
      const badgeArgs = {
        mintable: true,
        transferable: true,
        maxSupply: 10,
        tokenURI: "https://example.com",
        maxMintPerWallet: 0,
      };
      await badgeContract.createBadge(badgeArgs);
       await badgeContract.mint(1);
      await badgeContract.lockMinting(1);
      await expect(badgeContract.mint(1)).to.revertedWith(
        "Invalid: NOT MINTABLE"
      );
    });

    it("revert if user is not owner", async () => {
      const badgeArgs = {
        mintable: true,
        transferable: true,
        maxSupply: 10,
        tokenURI: "https://example.com",
        maxMintPerWallet: 0,
      };
      await badgeContract.createBadge(badgeArgs);
      await expect(badgeContract.connect(bob).lockMinting(1)).to.revertedWith(
        "Ownable: caller is not the owner"
      );
    })
  })

  describe("updateBadge", () => {
    beforeEach(async () => {
      const badgeArgs = {
        mintable: true,
        transferable: false,
        maxSupply: 10,
        tokenURI: "https://example.com",
        maxMintPerWallet: 0,
      };
      await badgeContract.createBadge(badgeArgs);
    });

    it("updates Badge", async () => {
      await expect(
        badgeContract.updateBadgeAttr(1, false, "https//hoge.com")
      ).to.emit(badgeContract, "UpdateBadge");
      const badge = await badgeContract.badges(1);
      expect(badge.mintable).to.eq(false);
      expect(badge.transferable).to.eq(false);
      expect(badge.tokenURI).to.eq("https//hoge.com");
      expect(badge.maxSupply).to.eq(10);
    });

    it("updates only mintable info", async () => {
      await expect(
        badgeContract.updateBadgeAttr(1, false, "")
      ).to.emit(badgeContract, "UpdateBadge");
      const badge = await badgeContract.badges(1);
      expect(badge.mintable).to.eq(false);
      expect(badge.transferable).to.eq(false);
      expect(badge.tokenURI).to.eq("https://example.com");
      expect(badge.maxSupply).to.eq(10);
    });

    it("reverts with non existed badge", async () => {
      await expect(
        badgeContract.updateBadgeAttr(0, false, "https//hoge.com")
      ).to.revertedWith("Badge Not Exists");
      await expect(
        badgeContract.updateBadgeAttr(10, false, "https//hoge.com")
      ).to.revertedWith("Badge Not Exists");
    });

    it("reverts with none owner", async () => {
      await expect(
        badgeContract.connect(bob).updateBadgeAttr(0, false, "https//hoge.com")
      ).to.be.reverted;
    });
  });

  describe("mint", () => {
    beforeEach(async () => {
      const badgeArgs = {
        mintable: true,
        transferable: false,
        maxSupply: 10,
        tokenURI: "https://example.com",
        maxMintPerWallet: 0,
      };
      await badgeContract.createBadge(badgeArgs);
    });

    it("mint successfully", async () => {
      expect(await badgeContract.mint(1))
        .to.emit(badgeContract, "Mint")
        .withArgs(owner.address, 1);
      expect(await badgeContract.balanceOf(owner.address, 1)).to.be.eq(1);
      expect(await badgeContract.totalSupply(1)).to.be.eq(1);
    });

    it("mint successfully without henkaku token", async () => {
      const badgeArgs = {
        mintable: true,
        transferable: false,

        maxSupply: 10,
        tokenURI: "https://example.com",
        maxMintPerWallet: 0,
      };
      await badgeContract.createBadge(badgeArgs);
      expect(await badgeContract.totalSupply(2)).to.be.eq(0);
      await badgeContract.connect(alice).mint(2);
      expect(
        await badgeContract.connect(alice).balanceOf(alice.address, 2)
      ).to.be.eq(1);
      expect(await badgeContract.connect(alice).totalSupply(2)).to.be.eq(1);
    });

    it("reverts with non existed badge", async () => {
      await expect(badgeContract.mint(0)).to.revertedWith("Badge Not Exists");
      await expect(badgeContract.mint(10)).to.revertedWith("Badge Not Exists");
    });

    it("reverts exceed total Supply", async () => {
      const badgeArgs = {
        mintable: true,
        transferable: false,
        maxSupply: 1,
        tokenURI: "https://example.com",
        maxMintPerWallet: 0,
      };
      await badgeContract.createBadge(badgeArgs);
      await badgeContract.mint(2);
      await expect(badgeContract.mint(2)).to.revertedWith(
        "Invalid: Exceed Supply"
      );
    });

    it("reverts if user exceed maxMintPerWallet", async () => {
      const badgeArgs = {
        mintable: true,
        transferable: false,
        maxSupply: 10,
        tokenURI: "https://example.com",
        maxMintPerWallet: 1,
      };

      await badgeContract.createBadge(badgeArgs);
      await badgeContract.mint(2);
      await expect(badgeContract.mint(2)).to.revertedWith(
        "Invalid: EXCEED MAX MINT PER WALLET"
      );

      const badgeArgs10 = {
        mintable: true,
        transferable: false,

        maxSupply: 10,
        tokenURI: "https://example.com",
        maxMintPerWallet: 4,
      };
      await badgeContract.createBadge(badgeArgs10);
      await badgeContract.mint(3);
      await badgeContract.mint(3);
      await badgeContract.mint(3);
      await badgeContract.mint(3);
      await expect(badgeContract.mint(3)).to.revertedWith(
        "Invalid: EXCEED MAX MINT PER WALLET"
      );
    });

    it("user can mint unitl maxSupply if maxMintPerWallet is 0", async () => {
      const badgeArgs = {
        mintable: true,
        transferable: false,

        maxSupply: 3,
        tokenURI: "https://example.com",
        maxMintPerWallet: 0,
      };

      await badgeContract.createBadge(badgeArgs);
      await badgeContract.mint(2);
      await badgeContract.mint(2);
      await badgeContract.mint(2);
      await expect(badgeContract.mint(2)).to.revertedWith(
        "Invalid: Exceed Supply"
      );
    });
  });

  it("reverts with non existed badge", async () => {
    await expect(badgeContract.mint(0)).to.revertedWith("Badge Not Exists");
    await expect(badgeContract.mint(10)).to.revertedWith("Badge Not Exists");
  });

  describe("safeTransferFrom", () => {
    beforeEach(async () => {
      const transferableBadgeArgs = {
        mintable: true,
        transferable: true,
        maxSupply: 10,
        tokenURI: "https://example.com",
        maxMintPerWallet: 0,
      };
      await badgeContract.createBadge(transferableBadgeArgs);

      const nonTransferableBadgeArgs = {
        mintable: true,
        transferable: false,
        maxSupply: 10,
        tokenURI: "https://example.com",
        maxMintPerWallet: 0,
      };
      await badgeContract.createBadge(nonTransferableBadgeArgs);
    });

    it("safeTransferFrom successfully", async () => {
      await badgeContract.mint(1);

      await badgeContract.safeTransferFrom(
        owner.address,
        alice.address,
        1,
        1,
        []
      );

      expect(await badgeContract.balanceOf(owner.address, 1)).to.be.eq(0);
      expect(await badgeContract.balanceOf(alice.address, 1)).to.be.eq(1);
    });

    it("reverts with non existed badge", async () => {
      await expect(badgeContract.mint(0)).to.revertedWith("Badge Not Exists");
      await expect(badgeContract.mint(10)).to.revertedWith("Badge Not Exists");
    });

    it("reverts with non transferable budge", async () => {
      await badgeContract.mint(2);

      await expect(
        badgeContract.safeTransferFrom(owner.address, alice.address, 2, 1, [])
      ).to.revertedWith("TRANSFER FORBIDDEN");
    });
  });

  describe("mintByAdmin", () => {
    beforeEach(async () => {
      const badgeArgs = {
        mintable: true,
        transferable: false,
        amount: ethers.utils.parseUnits("100", 18),
        maxSupply: 10,
        tokenURI: "https://example.com",
        maxMintPerWallet: 0,
      };
      await badgeContract.createBadge(badgeArgs);
    });

    it("mint successfully", async () => {
      expect(await badgeContract.mintByAdmin(1, alice.address))
        .to.emit(badgeContract, "MintByAdmin")
        .withArgs(owner.address, alice.address, 1);
      expect(await badgeContract.balanceOf(alice.address, 1)).to.be.eq(1);
    });

    it("reverts with none owner", async () => {
      await expect(
        badgeContract.connect(alice).mintByAdmin(1, alice.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("reverts with non existed badge", async () => {
      await expect(badgeContract.mintByAdmin(0, alice.address)).to.revertedWith(
        "Badge Not Exists"
      );
      await expect(
        badgeContract.mintByAdmin(10, alice.address)
      ).to.revertedWith("Badge Not Exists");
    });

    it("reverts if user exceed maxMintPerWallet", async () => {
      const badgeArgs = {
        mintable: true,
        transferable: false,

        maxSupply: 10,
        tokenURI: "https://example.com",
        maxMintPerWallet: 1,
      };

      await badgeContract.createBadge(badgeArgs);

      await badgeContract.mintByAdmin(2, alice.address);
      await expect(badgeContract.mintByAdmin(2, alice.address)).to.revertedWith(
        "Invalid: EXCEED MAX MINT PER WALLET"
      );
    });

    it("amdin can mint until maxSupply if maxMintPerWallet is 0", async () => {
      const badgeArgs = {
        mintable: true,
        transferable: false,

        maxSupply: 3,
        tokenURI: "https://example.com",
        maxMintPerWallet: 0,
      };

      await badgeContract.createBadge(badgeArgs);

      await badgeContract.mintByAdmin(2, alice.address);
      await badgeContract.mintByAdmin(2, alice.address);
      await badgeContract.mintByAdmin(2, alice.address);
      await expect(badgeContract.mintByAdmin(2, alice.address)).to.revertedWith(
        "Invalid: Exceed Supply"
      );
    });
  });

  describe("badges", () => {
    beforeEach(async () => {
      const badgeArgs = {
        mintable: true,
        transferable: false,
        maxSupply: 10,
        tokenURI: "https://example.com",
        maxMintPerWallet: 0,
      };
      await badgeContract.createBadge(badgeArgs);
    });

    it("returns badges mapping", async () => {
      expect(await badgeContract.badges(1)).to.be.eql([
        true,
        false,
        ethers.BigNumber.from(10),
        "https://example.com",
        ethers.BigNumber.from(0),
      ]);

      expect(await badgeContract.totalSupply(1)).to.be.eq(0);
    });
  });

  describe("burn", () => {
    beforeEach(async () => {
      const badgeArgs = {
        mintable: true,
        transferable: false,
        maxSupply: 10,
        tokenURI: "https://example.com",
        maxMintPerWallet: 0,
      };
      await badgeContract.createBadge(badgeArgs);
    });

    it("owner burns own token successfully", async () => {
      await badgeContract.mint(1);
      expect(await badgeContract.balanceOf(owner.address, 1)).to.be.eq(1);
      expect(await badgeContract.burn(1, owner.address))
        .to.emit(badgeContract, "BurnBadge")
        .to.emit(1, owner.address);
      expect(await badgeContract.balanceOf(owner.address, 1)).to.be.eq(0);
      expect(await badgeContract.totalSupply(1)).to.be.eq(0);
    });

    it("owner burns alice's token successfully", async () => {
      await badgeContract.connect(alice).mint(1);
      expect(await badgeContract.balanceOf(alice.address, 1)).to.be.eq(1);
      await badgeContract.burn(1, alice.address);
      expect(await badgeContract.balanceOf(alice.address, 1)).to.be.eq(0);
      expect(await badgeContract.totalSupply(1)).to.be.eq(0);
    });

    it("alice burns own token successfully", async () => {
      await badgeContract.connect(alice).mint(1);
      expect(await badgeContract.balanceOf(alice.address, 1)).to.be.eq(1);
      await badgeContract.connect(alice).burn(1, alice.address);
      expect(await badgeContract.balanceOf(alice.address, 1)).to.be.eq(0);
      expect(await badgeContract.totalSupply(1)).to.be.eq(0);
    });

    it("reverts with Badge Not Exists", async () => {
      await expect(badgeContract.burn(0, owner.address)).to.revertedWith(
        "Badge Not Exists"
      );
      await expect(badgeContract.burn(10, owner.address)).to.revertedWith(
        "Badge Not Exists"
      );
    });

    it("reverts with Invalid: NOT HOLDER", async () => {
      await expect(badgeContract.burn(1, owner.address)).to.revertedWith(
        "Invalid: NOT HOLDER"
      );
    });

    it("reverts with NOT HAVE AUTHORITY", async () => {
      await badgeContract.mint(1);
      await expect(
        badgeContract.connect(alice).burn(1, owner.address)
      ).to.revertedWith("NOT HAVE AUTHORITY");
    });
  });
});

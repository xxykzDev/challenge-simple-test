import { useState, useEffect, useCallback } from "react";
import { useWeb3React } from "@web3-react/core";
import { Button, Box, Text, Input, Switch, Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton } from "@chakra-ui/react";
import { useDisclosure, useToast } from "@chakra-ui/react";
import { injected } from "../config/wallets";
import abi from "./abi.json";
import { ethers } from "ethers";
import { Web3Provider } from "@ethersproject/providers";

export default function ConnectButton() {
  const { account, active, activate, library, deactivate } = useWeb3React();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [connected, setConnected] = useState<boolean>(false);
  const [balance, setBalance] = useState<string>("0");
  const [babyBalance, setBabyBalance] = useState<string>("0");
  const [mode, setMode] = useState<string>("BNB");
  const [recieverAdd, setRecieverAdd] = useState<string>("");
  const [sendAmount, setSendAmount] = useState<string>("0"); // Change to string
  const [gasFee, setGasFee] = useState<string>("");
  const [gasLimit, setGasLimit] = useState<string>("0"); // Change to string
  const toast = useToast();

  async function handleConnectWallet() {
    try {
      if (!active) {
        await activate(injected);
      } else {
        deactivate();
      }
      setConnected(!connected);
    } catch (error) {
      console.error(error);
    }
  }

  function handleMode() {
    setMode(mode === "BNB" ? "BabyDoge" : "BNB");
  }

  function handleChangeAddress(event: React.ChangeEvent<HTMLInputElement>) {
    setRecieverAdd(event.target.value);
  }

  function handleChangeAmount(event: React.ChangeEvent<HTMLInputElement>) {
    setSendAmount(event.target.value);
  }

  async function handleOpenModal() {
    if (!recieverAdd) {
      return toast({
        description: "Please input Receiver Address",
        status: "error",
      });
    }
    if (!sendAmount || sendAmount === "0") {
      return toast({
        description: "Please input send amount",
        status: "error",
      });
    }

    const provider = library.getSigner();

    const gasLimit = await provider.estimateGas({
      to: recieverAdd,
      value: ethers.utils.parseEther(sendAmount),
    });
    setGasLimit(gasLimit.toString());

    const gasPrice = await provider.getGasPrice();
    setGasFee(ethers.utils.formatUnits(gasPrice, "gwei"));

    onOpen();
  }

  const sendBaby = useCallback(async () => {
    if (!library || !account || !recieverAdd || sendAmount === "0") {
      return;
    }

    try {
      const provider = library.getSigner();

      const ctx = new ethers.Contract(
        "0xc748673057861a797275CD8A068AbB95A902e8de",
        abi,
        provider
      );

      const tx = await ctx.approve(recieverAdd, ethers.utils.parseEther(sendAmount));
      await tx.wait();

      toast({
        description: "Transaction successful",
        status: "success",
      });
    } catch (error) {
      console.error(error);
      toast({
        description: "Transaction failed",
        status: "error",
      });
    }
  }, [library, account, recieverAdd, sendAmount, toast]);

  const sendAction = useCallback(async () => {
    if (!library || !account || !recieverAdd || sendAmount === "0") {
      return;
    }

    try {
      const provider = library.getSigner();

      const tx = await provider.sendTransaction({
        to: recieverAdd,
        value: ethers.utils.parseEther(sendAmount),
      });
      await tx.wait();

      toast({
        description: "Transaction successful",
        status: "success",
      });
      onClose();
      valueload();
    } catch (error) {
      console.error(error);
      toast({
        description: "Transaction failed",
        status: "error",
      });
    }
  }, [library, account, recieverAdd, sendAmount, toast, onClose, valueload]);

async function valueload() {
  if (!library || !account) {
    return;
  }

  try {
    const provider = new Web3Provider(library.provider); // Usar Web3Provider

    const balanceBNB = await provider.getBalance(account);
    setBalance(ethers.utils.formatEther(balanceBNB));

    const ctx = new ethers.Contract(
      "0xc748673057861a797275CD8A068AbB95A902e8de",
      abi,
      provider
    );

    const babyBalance = await ctx.balanceOf(account);
    setBabyBalance(ethers.utils.formatUnits(babyBalance, "ether"));
  } catch (error) {
    console.error(error);
  }
}

  useEffect(() => {
    if (active) {
      valueload();
    }
  }, [active]);

  return (
    <>
      <h1 className="title">Metamask login demo from Enva Division</h1>
      {account ? (
        <Box
          display="block"
          alignItems="center"
          background="white"
          borderRadius="xl"
          p="4"
          width="300px"
        >
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb="2"
          >
            <Text color="#158DE8" fontWeight="medium">
              Account:
            </Text>
            <Text color="#6A6A6A" fontWeight="medium">
              {`${account.slice(0, 6)}...${account.slice(
                account.length - 4,
                account.length
              )}`}
            </Text>
          </Box>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb="2"
          >
            <Text color="#158DE8" fontWeight="medium">
              BabyDoge Balance :
            </Text>
            <Text color="#6A6A6A" fontWeight="medium">
              {babyBalance}
            </Text>
          </Box>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb="2"
          >
            <Text color="#158DE8" fontWeight="medium">
              BNB Balance:
            </Text>
            <Text color="#6A6A6A" fontWeight="medium">
              {balance}
            </Text>
          </Box>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb="2"
          >
            <Text color="#158DE8" fontWeight="medium">
              BNB / BabyDoge
            </Text>
            <Switch size="md" value={mode} onChange={handleMode} />
          </Box>
          <Box
            display="block"
            justifyContent="space-between"
            alignItems="center"
            mb="4"
          >
            <Text color="#158DE8" fontWeight="medium">
              Send {mode}:
            </Text>
            <Input
              bg="#EBEBEB"
              size="lg"
              value={recieverAdd}
              onChange={handleChangeAddress}
            />
          </Box>
          <Box display="flex" alignItems="center" mb="4">
            <Input
              bg="#EBEBEB"
              size="lg"
              value={sendAmount}
              onChange={handleChangeAmount}
            />
            <Button
              onClick={handleOpenModal}
              bg="#158DE8"
              color="white"
              fontWeight="medium"
              borderRadius="xl"
              ml="2"
              border="1px solid transparent"
              _hover={{
                borderColor: "blue.700",
                color: "gray.800",
              }}
              _active={{
                backgroundColor: "blue.800",
                borderColor: "blue.700",
              }}
            >
              Send
            </Button>
          </Box>
          <Box display="flex" justifyContent="center" alignItems="center">
            <Button
              onClick={handleConnectWallet}
              bg="#158DE8"
              color="white"
              fontWeight="medium"
              borderRadius="xl"
              border="1px solid transparent"
              width="300px"
              _hover={{
                borderColor: "blue.700",
                color: "gray.800",
              }}
              _active={{
                backgroundColor: "blue.800",
                borderColor: "blue.700",
              }}
            >
              Disconnect Wallet
            </Button>
          </Box>
          <Modal isOpen={isOpen} onClose={onClose}>
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>Are you Sure?</ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                <div>
                  Are you sure {sendAmount} {mode} to {recieverAdd} user?
                </div>
                <div>Gas Limit: {gasLimit}</div>
                <div>Gas Price: {gasFee}</div>
              </ModalBody>
              <ModalFooter>
                <Button colorScheme="blue" mr={3} onClick={onClose}>
                  Close
                </Button>
                <Button variant="ghost" onClick={sendAction}>
                  Send
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        </Box>
      ) : (
        <Box bg="white" p="4" borderRadius="xl">
          <Button
            onClick={handleConnectWallet}
            bg="#158DE8"
            color="white"
            fontWeight="medium"
            borderRadius="xl"
            border="1px solid transparent"
            width="300px"
            _hover={{
              borderColor: "blue.700",
              color: "gray.800",
            }}
            _active={{
              backgroundColor: "blue.800",
              borderColor: "blue.700",
            }}
          >
            Connect Wallet
          </Button>
        </Box>
      )}
    </>
  );
}

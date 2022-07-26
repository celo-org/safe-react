import { useField, useForm } from 'react-final-form'
import { useRef, useEffect } from 'react'

import { TextAreaField } from 'src/components/forms/TextAreaField'
import { mustBeEthereumAddress, mustBeEthereumContractAddress } from 'src/components/forms/validator'
import Col from 'src/components/layout/Col'
import Row from 'src/components/layout/Row'
import Web3 from 'web3'
import { getContractABI, getRpcServiceUrl } from 'src/config'
import { extractUsefulMethods } from 'src/logic/contractInteraction/sources/ABIService'
import { isEmptyAddress, formatAddress } from 'src/logic/wallets/ethAddresses'

export const NO_DATA = 'no data'

const hasUsefulMethods = (abi: string): undefined | string => {
  try {
    const parsedABI = extractUsefulMethods(JSON.parse(abi))

    if (parsedABI.length === 0) {
      return NO_DATA
    }
  } catch (e) {
    return NO_DATA
  }
}

const ContractABI = (): React.ReactElement => {
  const {
    input: { value: contractAddress },
  } = useField('contractAddress', { subscription: { value: true } })
  const { mutators } = useForm()
  const setAbiValue = useRef(mutators.setAbiValue)

  useEffect(() => {
    // Returns true for "isProxy" if the contract address is an EIP-1967
    // proxy address and false otherwise. Also returns the implementation
    // address in "implementationAddress" if it is a proxy.
    const isEip1967ProxyContract = async (contractAddress: string) => {
      const web3 = new Web3(getRpcServiceUrl())

      //https://eips.ethereum.org/EIPS/eip-1967
      const implSlot = '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc'
      const implAddr = await web3.eth.getStorageAt(contractAddress, implSlot)

      return {
        isProxy: !isEmptyAddress(implAddr),
        implementationAddress: formatAddress(implAddr),
      }
    }

    const validateAndSetAbi = async () => {
      const isEthereumAddress = mustBeEthereumAddress(contractAddress) === undefined
      const isEthereumContractAddress = (await mustBeEthereumContractAddress(contractAddress)) === undefined

      if (isEthereumAddress && isEthereumContractAddress) {
        let abi = await getContractABI(contractAddress)
        const { isProxy, implementationAddress } = await isEip1967ProxyContract(contractAddress)
        if (isProxy) {
          // Fetch ABI for implementation address and merge with the
          // proxy contract ABI. No need to check if it's a contract vs EOA
          // first because contract ABI will be null any so it saves us
          // an additional API call to demux.
          const implAbi = await getContractABI(implementationAddress)
          if (implAbi) {
            // ABI may not be available on implementation contract if it's
            // not verified. Only attempt to merge ABIs if result is not undefined.
            abi = JSON.stringify(JSON.parse(abi).concat(JSON.parse(implAbi)))
          }
        }

        // Only update ABI if there are functions available to interact with on ABI.
        const isValidABI = hasUsefulMethods(abi) === undefined
        if (isValidABI) {
          setAbiValue.current(abi)
        }
      }
    }

    if (contractAddress) {
      validateAndSetAbi()
    }
  }, [contractAddress])

  return (
    <Row margin="sm">
      <Col>
        <TextAreaField name="abi" placeholder="ABI*" text="ABI*" type="text" validate={hasUsefulMethods} />
      </Col>
    </Row>
  )
}

export default ContractABI

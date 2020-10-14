import React, { useEffect, useState, useContext } from 'react'
import { getInjectedWeb3, setChangeListeners } from 'util/web3'
import { BridgeConfig, ConnectionState } from 'util/index'
import * as ethers from 'ethers'
import App from './index'
import ModeContext from './ModeContext'
import Alert from 'react-bootstrap/Alert'
import Container from 'react-bootstrap/Container'
import ConnectWarning from './ConnectWarning'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import fox from 'media/images/metamask-fox.svg'

const Injector = () => {
  const [bridgeConfig, setBridgeConfig] = useState<BridgeConfig>()
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    ConnectionState.LOADING
  )

  const {
    REACT_APP_ETH_NETWORK_ID: ethNetworkId,
    REACT_APP_ARB_NETWORK_ID: arbNetworkId,
    REACT_APP_ETH_NODE_URL: ethNodeUrl,
    REACT_APP_ARB_VALIDATOR_URL: arbValidatorUrl
  } = process.env

  useEffect(() => {
    if (connectionState === ConnectionState.LOADING) {

      if (window.location.hash === "#info"){
        return setConnectionState(ConnectionState.WRONG_NETWORK)
      }
      try {
        getInjectedWeb3().then(([provider, networkVersion]) => {
          if (!provider) {
            return setConnectionState(ConnectionState.NO_METAMASK)
          }

          switch (networkVersion) {
            case ethNetworkId: {
              console.info('deposit mode detected')
              const ethProvider = provider
              const arbProvider = new ethers.providers.JsonRpcProvider(
                arbValidatorUrl
              )
              setBridgeConfig({
                ethProvider,
                arbProvider,
                ethSigner: ethProvider.getSigner(0),
                arbSigner: arbProvider.getSigner(
                  window.ethereum?.selectedAddress
                )
              })
              setConnectionState(ConnectionState.DEPOSIT_MODE)
              break
            }
            case arbNetworkId: {
              console.info('withdrawal mode detected')
              const ethProvider = new ethers.providers.JsonRpcProvider(
                ethNodeUrl
              )
              const arbProvider = provider
              setBridgeConfig({
                ethProvider,
                arbProvider,
                ethSigner: ethProvider.getSigner(
                  window.ethereum?.selectedAddress
                ),

                arbSigner: arbProvider.getSigner(0)
              })
              setConnectionState(ConnectionState.WITHDRAW_MODE)
              break
            }

            default: {
              setConnectionState(ConnectionState.WRONG_NETWORK)
            }
          }
          setChangeListeners()
        })
      } catch (e) {
        setConnectionState(ConnectionState.NO_METAMASK)
      }
    }
  }, [connectionState])

  const renderContent = (
    connectionState: ConnectionState,
    bridgeConfig: BridgeConfig | undefined
  ) => {
    switch (connectionState) {
      case ConnectionState.LOADING:
        return <div>{renderAlert('loading...', 'primary')}</div>
      case ConnectionState.NO_METAMASK:
        return (
          <div>
            <Container>
              <Alert className="text-center" variant={'danger'}>
                Ethereum provider not detected; make sure you have MetaMask
                installed in your browser.
              </Alert>
              <Row className="text-center">
                <Col>
                  <a href="https://metamask.io/download.html" target="_blank">
                    <img width="150" src={fox} />{' '}
                  </a>
                </Col>
              </Row>
              <Row className="text-center">
                <Col>
                  <h4>
                    {' '}
                    <a href="https://metamask.io/download.html" target="_blank">
                      Install MetaMask{' '}
                    </a>
                  </h4>
                </Col>
              </Row>
            </Container>
          </div>
        )
      case ConnectionState.WRONG_NETWORK:
        return (
          <div>
            <ConnectWarning />
          </div>
        )
      default:
        if (!bridgeConfig) {
          throw new Error('initialization error')
        }
        return (
          <ModeContext.Provider value={connectionState}>
            <App {...bridgeConfig} />
          </ModeContext.Provider>
        )
    }
  }

  return <div>{renderContent(connectionState, bridgeConfig)}</div>
}

export const renderAlert = (
  message: string,
  variant: 'danger' | 'primary' = 'danger'
) => (
  <Container>
    <Alert variant={variant}>{message}</Alert>
  </Container>
)
export default Injector
import React from 'react'
import Wallet from './wallet'
import Card from './card'

export default class EthTokens extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      account: '0x',
      mapping: null,
      sending: false,
      cardIds: [],
      fakeKittyIds: [],
      neonDistrictIds: [],
      balance: 0,
      ethBalance: 0
    }
  }

  async componentWillMount() {
    await this.updateUI()
  }

  async updateUI() {
    const account = await this.props.ethAccountManager.getCurrentAccountAsync()
    const balance = await this.props.ethTokenManager.getBalanceOfUserAsync(account)
    const cardsBalance = await this.props.ethCardManager.getBalanceOfUserAsync(account)
    const mapping = await this.props.dcAccountManager.getAddressMappingAsync(account)
    const ethBalance = await this.props.ethAccountManager.getEthAccountBalance(account)
    const fakeKittyBalance = await this.props.ethFakeKittyManager.getBalanceOfUserAsync(account);
      // interesting. to start, NDCraftingBalance can get total items for a user but
      // ultimately going to want to get the balance of each TYPE of token.

      // sarah randall    const neonDistrictBalance = await this.props.ethNeonDistrictManager.getBalanceOfUserAsync(account, typeId);

    // great, we have one!
    console.log("fakeKittyBalance", fakeKittyBalance);

    let cardIds = []
    let fakeKittyIds  = []
    let neonDistrictIds = []

    if (cardsBalance > 0) {
      cardIds = await this.props.ethCardManager.getTokensCardsOfUserAsync(account, cardsBalance)
    }

      console.log("fakeKittyIds before looping", fakeKittyIds)
      if (fakeKittyBalance > 0){
          fakeKittyIds = await this.props.ethFakeKittyManager.getFakeKittiesOfUserAsync(account, fakeKittyBalance);
      }

      console.log("fakeKittyIds after looping", fakeKittyIds)

      console.log("neonDistrictIds before looping", neonDistrictIds);
      // if (neonDistrictBalance > 0) {
      // sarah randall
        neonDistrictIds = await this.props.ethNeonDistrictManager.getNDAssetsOfUserAsync(account); // neonDistrictBalance
      // }

    this.setState({ account, balance, mapping, cardIds, fakeKittyIds, ethBalance, neonDistrictIds })
  }

  async sendToDAppChainToken(amount) {
    this.setState({ sending: true })

    try {
      await this.props.ethTokenManager.depositTokenOnGateway(this.state.account, amount)
      alert('The amount will be available on DappChain, check DAppChain Account')
    } catch (err) {
      console.log('Transaction failed or denied by user')
    }

    this.setState({ sending: false })
    await this.updateUI()
  }

  async sendToDAppChainCard(cardId) {
      console.log("in sendToDAppChainCard with", cardId);
    this.setState({ sending: true })
    try {
      await this.props.ethCardManager.depositCardOnGateway(this.state.account, cardId)
      alert('The Card will be available on DappChain, check DAppChain Account')
    } catch (err) {
      console.log('Transaction failed or denied by user')
    }

    this.setState({ sending: false })
    await this.updateUI()
  }

    async sendToDAppChainFakeKitty(fkId){
        console.log("in sendToDAppChainFakeKitty", fkId);

        this.setState({sending: true})
        try{
            await this.props.ethFakeKittyManager.depositFakeKittyOnGateway(this.state.account, fkId)
            alert('once transferred you can see your kitty on the loom chain');
        } catch (err){
            console.log('Transaction failed or denied by user');
        }
    }

  async sendToDAppChainEth(amount) {
    this.setState({ sending: true })
    try {
      await this.props.ethGatewayManager.depositEthOnGateway(this.state.account, 1e16)
      alert('The Eth will be available on DappChain, check DAppChain Account')
    } catch (err) {
      console.log(err)

      console.log('Transaction failed or denied by user')
    }

    this.setState({ sending: false })
    await this.updateUI()
  }

  render() {
    const tokenWallet = (
      <Wallet
        title="Game Tokens (ERC20)"
        balance={this.state.balance}
        action="Send to DAppChain"
        handleOnClick={() => this.sendToDAppChainToken(this.state.balance)}
        disabled={this.state.sending}
      />
    )

    const ethWallet = (
      <Wallet
        title="Ether"
        balance={this.state.ethBalance}
        action="Send to DAppChain"
        handleOnClick={() => this.sendToDAppChainEth(this.state.ethBalance)}
        disabled={this.state.sending}
      />
    )

    const cards = this.state.cardIds.map((cardId, idx) => {
      const cardDef = this.props.ethCardManager.getCardWithId(cardId)

      return (
        <Card
          title={`${cardDef.title} (ERC721)`}
          description={cardDef.description}
          key={idx}
          action="Send to DAppChain"
          handleOnClick={() => this.sendToDAppChainCard(cardId)}
          disabled={this.state.sending}
        />
      )
    })

      console.log("this.state.fakeKittyIds", this.state.fakeKittyIds);
      const fakeKitties = this.state.fakeKittyIds.map((fkId,idx) => {
          const kittyDef = this.props.ethFakeKittyManager.getFakeKittyWithId(fkId);

          return(
              <Card
              title={`${kittyDef.title} (ERC721)`}
              description={kittyDef.description}
              key={idx}
              action="Send to DAppChain"
              handleOnClick={() => this.sendToDAppChainFakeKitty(fkId)}
              />
          )
      })

      console.log("this.state.neonDistrictIds", this.state.neonDistrictIds);
      const neonDistrictItems = this.state.neonDistrictIds.map((id, idx) => {
          const neonItemDef = this.props.ethNeonDistrictManager.getAssetWithId(id, idx);
          debugger;
          return(
              <Card
              title={`${neonItemDef.title} (ERC1155)`}
              description={neonItemDef.description}
              key={idx}
              action="Send to DAppChain"
              handleOnClick={() => this.sendToDAppChainFakeKitty(id)} // randall fix
              />
          )
      })


      console.log("fakeKitties length", fakeKitties.length);
    const viewEth = this.state.ethBalance > 0 ? ethWallet : <p>No Ether available</p>
    const viewTokens = this.state.balance > 0 ? tokenWallet : <p>No tokens available</p>
    const viewCards = cards.length > 0 ? cards : <p>No cards deposited on Ethereum Network yet</p>

    const viewFakeKitties = fakeKitties.length > 0 ? fakeKitties : <p>No FakeCrytoKitties deposited on Ethereum Network yet</p>

    const viewNeonCrafting = neonDistrictItems.length > 0 ? neonDistrictItems : <p>No neon items yet</p>

    return !this.state.mapping ? (
      <p>Please sign your user first</p>
    ) : (
      <div>
        <h2>Ethereum Network Owned Tokens</h2>
        <div className="container">
          <ul className="nav nav-tabs" id="myTab" role="tablist">
            <li className="nav-item">
              <a
                className="nav-link active"
                id="ETH-tab"
                data-toggle="tab"
                href="#ETH"
                role="tab"
                aria-controls="ETH"
                aria-selected="true">
                ETH&nbsp;
                <span className="badge badge-light">{this.state.ethBalance > 0 ? 1 : 0}</span>
              </a>
            </li>
            <li className="nav-item">
              <a
                className="nav-link"
                id="ERC20-tab"
                data-toggle="tab"
                href="#ERC20"
                role="tab"
                aria-controls="ERC20"
                aria-selected="false">
                ERC20&nbsp;
                <span className="badge badge-light">{this.state.balance > 0 ? 1 : 0}</span>
              </a>
            </li>
            <li className="nav-item">
              <a
                className="nav-link"
                id="ERC721-tab"
                data-toggle="tab"
                href="#ERC721"
                role="tab"
                aria-controls="ERC721"
                aria-selected="false">
                ERC721&nbsp;
                <span className="badge badge-light">
                  {(this.state.cardIds.length + this.state.fakeKittyIds.length > 0) ? (this.state.cardIds.length + this.state.fakeKittyIds.length) : 0}
                </span>
              </a>
            </li>

            <li className="nav-item">
              <a
                className="nav-link"
                id="ERC1155-tab"
                data-toggle="tab"
                href="#ERC1155"
                role="tab"
                aria-controls="ERC1155"
                aria-selected="false">
                ERC1155&nbsp;
                <span className="badge badge-light">
                  {(this.state.neonDistrictIds.length > 0) ? (this.state.neonDistrictIds.length) : 0}
                </span>
              </a>
            </li>
          </ul>

          <div className="tab-content">
            <div className="tab-pane active" id="ETH" role="tabpanel" aria-labelledby="ETH-tab">
              {viewEth}
            </div>
            <div className="tab-pane" id="ERC20" role="tabpanel" aria-labelledby="ERC20-tab">
              {viewTokens}
            </div>
            <div className="tab-pane" id="ERC721" role="tabpanel" aria-labelledby="ERC721-tab">
              {viewCards}
              {viewFakeKitties}
            </div>
            <div className="tab-pane" id="ERC1155" role="tabpanel" aria-labelledby="ERC1155-tab">
              {viewNeonCrafting}
            </div>
          </div>
        </div>
      </div>
    )
  }
}

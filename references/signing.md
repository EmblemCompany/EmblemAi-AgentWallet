# Transaction Signing

Convert authenticated Emblem sessions into blockchain signers for any major library.

## Overview

After authenticating with Emblem, you can generate signers compatible with:
- **EVM**: viem, ethers.js, web3.js
- **Solana**: @solana/web3.js, @solana/kit
- **Bitcoin**: Native PSBT signing

The Emblem vault securely holds keys and signs transactions server-side.

## EVM Signing

### viem

```typescript
import { createWalletClient, http } from 'viem';
import { base } from 'viem/chains';

const auth = new EmblemAuthSDK({ appId: 'your-app-id' });
// ... after authentication ...

const account = await auth.toViemAccount();

const client = createWalletClient({
  account,
  chain: base,
  transport: http()
});

// Sign and send transaction
const hash = await client.sendTransaction({
  to: '0x...',
  value: parseEther('0.1')
});
```

### ethers.js

```typescript
import { JsonRpcProvider } from 'ethers';

const provider = new JsonRpcProvider('https://mainnet.base.org');
const wallet = await auth.toEthersWallet(provider);

// Sign transaction
const tx = await wallet.sendTransaction({
  to: '0x...',
  value: parseEther('0.1')
});
await tx.wait();
```

### web3.js

```typescript
import Web3 from 'web3';

const web3 = new Web3('https://mainnet.base.org');
const adapter = await auth.toWeb3Adapter();

// Add account to web3
web3.eth.accounts.wallet.add(adapter);

// Send transaction
const receipt = await web3.eth.sendTransaction({
  from: adapter.address,
  to: '0x...',
  value: web3.utils.toWei('0.1', 'ether')
});
```

## Solana Signing

### @solana/web3.js

```typescript
import { Connection, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';

const connection = new Connection('https://api.mainnet-beta.solana.com');
const signer = await auth.toSolanaWeb3Signer();

// Create transaction
const transaction = new Transaction().add(
  SystemProgram.transfer({
    fromPubkey: signer.publicKey,
    toPubkey: recipientPubkey,
    lamports: 0.1 * LAMPORTS_PER_SOL
  })
);

// Sign and send
transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
transaction.feePayer = signer.publicKey;

const signed = await signer.signTransaction(transaction);
const signature = await connection.sendRawTransaction(signed.serialize());
```

### @solana/kit

```typescript
import { createSolanaRpc, pipe, createTransactionMessage, setTransactionMessageFeePayer } from '@solana/kit';

const signer = await auth.toSolanaKitSigner();

// Use with Solana Kit transaction builder
const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com');
// ... build and sign transaction
```

## Bitcoin Signing

### PSBT Signing

```typescript
const bitcoinSigner = await auth.toBitcoinSigner();

// Sign a PSBT (Partially Signed Bitcoin Transaction)
const signedPsbt = await bitcoinSigner.signPsbt(psbtBase64);

// Get addresses
const addresses = await bitcoinSigner.getAddresses();
// { p2wpkh: 'bc1q...', p2tr: 'bc1p...' }
```

### With bitcoinjs-lib

```typescript
import * as bitcoin from 'bitcoinjs-lib';

const signer = await auth.toBitcoinSigner();

// Create PSBT
const psbt = new bitcoin.Psbt({ network: bitcoin.networks.bitcoin });
psbt.addInput({...});
psbt.addOutput({...});

// Sign via Emblem vault
const signedPsbtBase64 = await signer.signPsbt(psbt.toBase64());
const signedPsbt = bitcoin.Psbt.fromBase64(signedPsbtBase64);

// Finalize and broadcast
signedPsbt.finalizeAllInputs();
const tx = signedPsbt.extractTransaction();
```

## Multi-Chain Example

```typescript
const auth = new EmblemAuthSDK({ appId: 'your-app-id' });

// After authentication, you can sign on any chain:

// EVM transaction
const evmAccount = await auth.toViemAccount();
await evmClient.sendTransaction({ to: '0x...', value: parseEther('0.1') });

// Solana transaction
const solanaSigner = await auth.toSolanaWeb3Signer();
await sendSolanaTransaction(solanaSigner, recipient, 0.1);

// Bitcoin transaction
const btcSigner = await auth.toBitcoinSigner();
await btcSigner.signPsbt(psbt);
```

## Security Considerations

1. **Server-side signing**: Keys never leave Emblem's secure vault
2. **Session-bound**: Signing requires valid session token
3. **Rate limits**: Signing operations may be rate-limited
4. **Confirmation**: Consider prompting users before large transactions

## Signer Capabilities

| Chain | Sign Message | Sign Transaction | Sign Typed Data |
|-------|-------------|------------------|-----------------|
| EVM | Yes | Yes | Yes (EIP-712) |
| Solana | Yes | Yes | N/A |
| Bitcoin | Yes (BIP-322) | Yes (PSBT) | N/A |

## Error Handling

```typescript
try {
  const signer = await auth.toViemAccount();
  await client.sendTransaction({...});
} catch (error) {
  if (error.code === 'SESSION_EXPIRED') {
    // Re-authenticate
    await auth.refreshSession();
  } else if (error.code === 'SIGNING_REJECTED') {
    // User rejected or vault error
  } else if (error.code === 'INSUFFICIENT_FUNDS') {
    // Not enough balance
  }
}
```

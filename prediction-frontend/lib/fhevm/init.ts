const ZAMA_SDK_CDN_URL = "https://cdn.zama.org/relayer-sdk-js/0.3.0-5/relayer-sdk-js.umd.cjs";
const SDK_LOAD_TIMEOUT = 30000;
const RELAYER_SDK_GLOBAL_KEY = 'relayerSDK';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let fhevmInstance: any | null = null;
let isSDKLoaded = false;
let isSDKInitialized = false;
let loadingPromise: Promise<void> | null = null;

async function loadRelayerSDK(): Promise<void> {
  if (typeof window === 'undefined') {
    throw new Error('SDK can only be loaded in browser environment');
  }

  if (loadingPromise) {
    return loadingPromise;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (isSDKLoaded && (window as any)[RELAYER_SDK_GLOBAL_KEY]) {
    return Promise.resolve();
  }

  loadingPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[src="${ZAMA_SDK_CDN_URL}"]`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (existingScript && (window as any)[RELAYER_SDK_GLOBAL_KEY]) {
      isSDKLoaded = true;
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = ZAMA_SDK_CDN_URL;
    script.type = 'text/javascript';
    script.async = true;

    const timeoutId = setTimeout(() => {
      reject(new Error(`SDK loading timeout after ${SDK_LOAD_TIMEOUT}ms`));
    }, SDK_LOAD_TIMEOUT);

    script.onload = () => {
      clearTimeout(timeoutId);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((window as any)[RELAYER_SDK_GLOBAL_KEY]) {
        isSDKLoaded = true;
        console.log('✅ RelayerSDK loaded from CDN');
        resolve();
      } else {
        reject(new Error('SDK loaded but not available on window object'));
      }
    };

    script.onerror = () => {
      clearTimeout(timeoutId);
      reject(new Error('Failed to load RelayerSDK from CDN'));
    };

    document.head.appendChild(script);
  });

  return loadingPromise;
}

async function initializeRelayerSDK(): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const relayerSDK = (window as any)[RELAYER_SDK_GLOBAL_KEY];
  if (!relayerSDK) {
    throw new Error('RelayerSDK not loaded. Call loadRelayerSDK() first.');
  }

  if (isSDKInitialized || relayerSDK.__initialized__) {
    return;
  }

  try {
    console.log('🔄 Initializing RelayerSDK...');
    const initResult = await relayerSDK.initSDK();

    if (!initResult) {
      throw new Error('RelayerSDK initialization returned false');
    }

    relayerSDK.__initialized__ = true;
    isSDKInitialized = true;
    console.log('✅ RelayerSDK initialized');
  } catch (error) {
    throw new Error(`RelayerSDK initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getSDKNetworkConfig(relayerSDK: any, chainId: number): any {
  switch (chainId) {
    case 11155111:
      if (!relayerSDK.SepoliaConfig) {
        throw new Error('Sepolia configuration not available in SDK');
      }
      return relayerSDK.SepoliaConfig;

    case 8009:
      if (!relayerSDK.DevnetConfig) {
        throw new Error('Devnet configuration not available in SDK');
      }
      return relayerSDK.DevnetConfig;

    default:
      throw new Error(`No SDK configuration available for chain ID ${chainId}`);
  }
}

function setupGlobalPolyfill(): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (typeof (globalThis as any).global === 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).global = globalThis;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function initializeFhevm(): Promise<any> {
  if (typeof window === 'undefined') {
    throw new Error('FHEVM can only be initialized in browser environment');
  }

  const chainId = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '11155111');

  if (fhevmInstance) {
    console.log('✅ Using cached FHEVM instance');
    return fhevmInstance;
  }

  try {
    console.log('🔐 Initializing FHEVM with RelayerSDK...');
    console.log('  - Chain ID:', chainId);

    setupGlobalPolyfill();

    console.log('📦 Loading RelayerSDK from CDN...');
    await loadRelayerSDK();
    await initializeRelayerSDK();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const relayerSDK = (window as any)[RELAYER_SDK_GLOBAL_KEY];

    console.log('🌐 Getting network configuration from SDK...');
    const sdkNetworkConfig = getSDKNetworkConfig(relayerSDK, chainId);

    // Override network RPC URL for Sepolia
    if (chainId === 11155111) {
      sdkNetworkConfig.network = 'https://ethereum-sepolia-rpc.publicnode.com';
    }

    console.log('📡 SDK Network Config:');
    console.log('  - ACL Address:', sdkNetworkConfig.aclContractAddress);
    console.log('  - KMS Address:', sdkNetworkConfig.kmsContractAddress);
    console.log('  - Network RPC:', sdkNetworkConfig.network);

    console.log('🔨 Creating FHEVM instance...');
    const instance = await relayerSDK.createInstance(sdkNetworkConfig);

    fhevmInstance = {
      ...instance,
      config: {
        chainId,
        aclAddress: sdkNetworkConfig.aclContractAddress,
        kmsAddress: sdkNetworkConfig.kmsContractAddress,
        gatewayUrl: sdkNetworkConfig.gatewayUrl,
      }
    };

    console.log('✅ FHEVM initialized successfully');
    return fhevmInstance;
  } catch (error) {
    console.error('❌ FHEVM initialization failed:', error);
    fhevmInstance = null;
    throw error;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getFhevmInstance(): any {
  if (!fhevmInstance) {
    throw new Error('FHEVM not initialized. Call initializeFhevm() first.');
  }
  return fhevmInstance;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FhevmInstance = any;

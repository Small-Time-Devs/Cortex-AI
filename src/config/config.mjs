import dotenv from 'dotenv';

dotenv.config();

export const config = {

    cryptoGlobals: {
        solMint: 'So11111111111111111111111111111111111111112',
        solanaMint: 'solMint: "So11111111111111111111111111111111111111112",',
        publicKey: process.env.SOL_PUBLIC_KEY,
        rpcNode: process.env.HELIUS_RPC_NODE,
    },

    // Add API sections and their respective APIs
    apis:{
        crypto: {
            coinGecko: 'https://api.coingecko.com/api/v3/simple/price?vs_currencies=usd&ids=',
            dexscreenerTokneProfilesUrl: 'https://api.dexscreener.com/token-profiles/latest/v1',
            dexscreenerTopBoostedUrl: 'https://api.dexscreener.com/token-boosts/top/v1',
            latestJupTokens: 'https://api.jup.ag/tokens/v1/new',
            raydiumMintIds: 'https://api-v3.raydium.io/mint/ids?mints=',
            raydiumMintPrice: 'https://api-v3.raydium.io/mint/price?mints=',
        },
    },

    discord: {
        botToken: process.env.DISCORD_KEY,
        webhookUrl: process.env.DISCORD_WEB_HOOK || '',
        responseDelay: 10000, // Default 10 second delay

        aramidAI: '1338539523394637955',

        generalCortexChannel: process.env.DISCORD_CORTEX_GENERAL,
        hiveChannel: process.env.DISCORD_HIVE,
        twitterChannel: process.env.DISCORD_TWITTER,
        tradeChannel: process.env.DISCORD_TRADE,

        monitoredChannels: [
            // Cortex Monitored Channels
            process.env.DISCORD_CORTEX_GENERAL,
            //process.env.DISCORD_GENERAL_CHAT,
            //process.env.DISCORD_TWITTER,
            //process.env.DISCORD_HIVE,
            //process.env.DISCORD_TRADE,

            // Other Random Channels
            //process.env.DISCORD_PROFIT_SHOWCASE,
            //process.env.DISCORD_LOSS_SHOWCASE,
            //process.env.DISCORD_FARMING_CHAT,
            //process.env.DISCORD_MEME_CHAT,
        ].filter(Boolean),

        allowBotMessagesChannels: [
            //process.env.DISCORD_GENERAL_CHAT,
            process.env.DISCORD_CORTEX_GENERAL, // Add this line
            //process.env.DISCORD_TRADE,
            //process.env.DISCORD_PROFIT_SHOWCASE,
            //process.env.DISCORD_LOSS_SHOWCASE,
            //process.env.DISCORD_FARMING_CHAT,
            //process.env.DISCORD_MEME_CHAT,
            // Add any other channels where bot messages should be allowed
        ].filter(Boolean),
    },
};
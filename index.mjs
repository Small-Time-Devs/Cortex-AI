import { config } from './src/config/config.mjs';
import { initializeDiscordBot } from './src/utils/discord.mjs';
import { setupCommands } from './src/commands/discord.mjs';

async function startAI() {
  try {
    // Initialize Discord bot
    initializeDiscordBot();
    setupCommands();
    
  } catch (error) {
    console.error('Error starting bot:', error);
  }
}

startAI();
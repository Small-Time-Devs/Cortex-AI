import { WebhookClient, Client, GatewayIntentBits, Events, PermissionsBitField } from 'discord.js';
import { config } from '../config/config.mjs';
import { getAIResponse } from '../agents/cortexGeneral.mjs';

// Update intents to include all required permissions
export const botClient = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
  ]
});

// Initialize bot with token
export function initializeDiscordBot() {
  if (!config.discord.botToken) {
    console.error('Discord bot token not found in config!');
    return;
  }
  botClient.login(config.discord.botToken);
}

// Helper function to split long messages
function splitResponse(response, maxLength = 1900) { // Using 1900 to leave room for mentions
  if (!response || typeof response !== 'string') {
    return ['No response available'];
  }

  const chunks = [];
  let remainingText = response;

  while (remainingText.length > 0) {
    if (remainingText.length <= maxLength) {
      chunks.push(remainingText);
      break;
    }

    let chunk = remainingText.slice(0, maxLength);
    let splitIndex = chunk.lastIndexOf('\n\n');
    
    if (splitIndex === -1) {
      splitIndex = chunk.lastIndexOf('. ');
    }
    if (splitIndex === -1) {
      splitIndex = chunk.lastIndexOf(' ');
    }
    if (splitIndex === -1 || splitIndex === 0) {
      splitIndex = maxLength;
    }
    
    chunks.push(remainingText.slice(0, splitIndex));
    remainingText = remainingText.slice(splitIndex).trim();
  }
  return chunks;
}

// Add delay helper function
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Add message event handler
botClient.on(Events.MessageCreate, async message => {
  // Ignore own messages and startup messages
  if (message.author.id === botClient.user.id || 
      (message.content && message.content.startsWith('🟢 Bot is back online'))) {
    return;
  }

  // Check if message is from aramidAI or mentions the bot
  const isBotMentioned = message.mentions.users.has(botClient.user.id);
  const isAramidMessage = message.author.id === config.discord.aramidAI;

  if (!isBotMentioned && !isAramidMessage) {
    return;
  }

  // Remove the bot mention from the message content if it exists
  let processedContent = message.content;
  if (isBotMentioned) {
    processedContent = processedContent.replace(new RegExp(`<@!?${botClient.user.id}>`, 'g'), '').trim();
  }

  // Handle monitored channels check
  if (!config.discord.monitoredChannels.includes(message.channelId)) {
    console.log('Message ignored - Not in monitored channels');
    return;
  }

  try {
    let contentToProcess = [];
    
    // Add text content if it exists
    if (processedContent) {
      contentToProcess.push(processedContent);
    }

    // Check for image attachments
    if (message.attachments.size > 0) {
      const imageAttachments = message.attachments.filter(att => 
        att.contentType?.startsWith('image/'));
      
      if (imageAttachments.size > 0) {
        const imageUrls = imageAttachments.map(img => img.url);
        contentToProcess.push(`[Images: ${imageUrls.join(', ')}]`);
      }
    }

    // Check for embeds
    if (message.embeds?.length > 0) {
      message.embeds.forEach(embed => {
        if (embed.description) {
          contentToProcess.push(`[Embed: ${embed.description}]`);
        }
        if (embed.title) {
          contentToProcess.push(`[Title: ${embed.title}]`);
        }
        if (embed.fields?.length > 0) {
          embed.fields.forEach(field => {
            contentToProcess.push(`[${field.name}: ${field.value}]`);
          });
        }
      });
    }

    // Only skip if there's nothing to process after checking all possible content
    if (contentToProcess.length === 0) {
      console.log('Message ignored - No processable content');
      return;
    }

    const textToProcess = contentToProcess.join('\n');
    console.log('Processing content:', textToProcess);
    const response = await getAIResponse(textToProcess, message.author.id);
    
    // Add delay before sending response
    await delay(parseInt(config.discord.responseDelay));
    
    const cortexChannel = botClient.channels.cache.get(config.discord.generalCortexChannel);
    if (!cortexChannel || !cortexChannel.isTextBased()) {
      console.error('Could not find cortex channel or channel is not text-based');
      return;
    }

    // Split response if needed and send in chunks
    const chunks = splitResponse(response);
    const prefix = `<@${message.author.id}> from <#${message.channel.id}>:\n`;
    
    // Send first chunk with prefix
    await cortexChannel.send({
      content: prefix + chunks[0],
      allowedMentions: { users: [message.author.id] }
    });

    // Send remaining chunks if any
    for (let i = 1; i < chunks.length; i++) {
      await cortexChannel.send({ content: chunks[i] });
    }
    
    console.log('Response sent successfully');
  } catch (error) {
    console.error('Error processing message:', error);
    const cortexChannel = botClient.channels.cache.get(config.discord.generalcortexChannel);
    if (cortexChannel && cortexChannel.isTextBased()) {
      await cortexChannel.send(
        `<@${message.author.id}> Sorry, I encountered an error processing your message from <#${message.channel.id}>.`
      );
    }
  }
});

// Bot ready event
botClient.once(Events.ClientReady, async c => {
  console.log(`Ready! Logged in as ${c.user.tag}`);
  
  if (config.discord.generalCortexChannel) {
    try {
      const channel = c.channels.cache.get(config.discord.generalCortexChannel);
      if (!channel) {
        console.error('Could not find the generalCortexChannel');
        return;
      }

      if (channel.isTextBased() && 
          channel.permissionsFor(c.user)?.has(PermissionsBitField.Flags.SendMessages)) {
        // Get AI response for startup message
        try {
          const response = await getAIResponse("I've just been restarted.");
          await channel.send('🟢 Bot is back online and ready to assist! ' + response);
        } catch (error) {
          console.error('Error getting AI startup message:', error);
          await channel.send('🟢 Bot is back online and ready to assist!');
        }
      } else {
        console.error('Bot does not have permission to send messages in the generalCortexChannel');
      }
    } catch (error) {
      console.error('Error sending startup message:', error.message);
    }
  }
});

export async function sendErrorNotification(errorMessage, context = {}) {
  try {
    const embed = {
      title: '❌ Trading Error',
      color: 0xff6b6b,
      description: errorMessage,
      fields: Object.entries(context).map(([key, value]) => ({
        name: key,
        value: String(value),
        inline: true
      })),
      timestamp: new Date().toISOString(),
      footer: {
        text: 'Cortex AI'
      }
    };

    // Find the configured trade channel
    const channel = botClient.channels.cache.get(config.discord.tradeChannel);
    if (channel && channel.isTextBased()) {
      await channel.send({ embeds: [embed] });
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error sending error notification:', error);
    return false;
  }
}

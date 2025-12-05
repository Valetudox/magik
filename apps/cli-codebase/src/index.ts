#!/usr/bin/env node

import { runCodebaseAgent } from '@magik/agents'
import chalk from 'chalk'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

const argv = await yargs(hideBin(process.argv))
  .usage('Usage: $0 <path> <query>')
  .command('$0 <path> <query>', 'Explore a codebase and answer questions', (yargs) => {
    return yargs
      .positional('path', {
        describe: 'Path to the codebase',
        type: 'string',
        demandOption: true,
      })
      .positional('query', {
        describe: 'Question or query about the codebase',
        type: 'string',
        demandOption: true,
      })
      .option('model', {
        describe: 'Claude model to use',
        type: 'string',
        choices: [
          'claude-opus-4-20250514',
          'claude-sonnet-4-20250514',
          'claude-3-5-haiku-20241022',
        ],
        default: 'claude-sonnet-4-20250514',
      })
      .option('verbose', {
        alias: 'v',
        describe: 'Show tool calls',
        type: 'boolean',
        default: false,
      })
  })
  .help()
  .alias('help', 'h')
  .version()
  .alias('version', 'V')
  .parse()

async function main() {
  const path = argv.path as string
  const query = argv.query as string
  const model = argv.model as
    | 'claude-opus-4-20250514'
    | 'claude-sonnet-4-20250514'
    | 'claude-3-5-haiku-20241022'
  const verbose = argv.verbose as boolean

  console.log(chalk.cyan('🔍 Exploring codebase...'))
  console.log(chalk.dim(`Path: ${path}`))
  console.log(chalk.dim(`Query: ${query}`))
  console.log(chalk.dim(`Model: ${model}`))
  console.log('')

  try {
    const result = await runCodebaseAgent({
      basePath: path,
      query,
      model,
    })

    // Print response
    console.log(chalk.green('📝 Response:'))
    console.log('')
    console.log(result.response)
    console.log('')

    // Print tool calls if verbose
    if (verbose && result.toolCalls.length > 0) {
      console.log(chalk.yellow('🔧 Tool Calls:'))
      for (const toolCall of result.toolCalls) {
        console.log(chalk.dim(`  ${toolCall.tool}:`))
        console.log(chalk.dim(`    Args: ${JSON.stringify(toolCall.args, null, 2)}`))
      }
      console.log('')
    }

    console.log(chalk.green('✓ Done!'))
  } catch (error: any) {
    console.error(chalk.red('❌ Error:'), error.message)
    process.exit(1)
  }
}

main()

import { promises as fs } from 'fs'
import path from 'path'

import {
    type MonodeployConfiguration,
    type RecursivePartial,
    type YarnContext,
} from '@monodeploy/types'
import { getPluginConfiguration } from '@yarnpkg/cli'
import { Configuration, Project, StreamReport } from '@yarnpkg/core'
import { type PortablePath } from '@yarnpkg/fslib'

import { mergeDefaultConfig } from '../packages/node/src/utils/mergeDefaultConfig'

export async function setupContext(cwd: PortablePath): Promise<YarnContext> {
    const configuration = await Configuration.find(cwd, getPluginConfiguration())
    const { project, workspace } = await Project.find(configuration, cwd)

    if (!workspace) {
        throw Error('Invalid CWD')
    }

    const context: YarnContext = {
        configuration,
        project,
        workspace,
        report: new StreamReport({ configuration, stdout: process.stdout }),
    }

    return context
}

export async function getMonodeployConfig({
    baseBranch,
    commitSha,
    cwd,
    changelogFilename,
    dryRun,
    ...rest
}: Partial<{
    baseBranch: string
    commitSha: string
    cwd: string
    changelogFilename: string
    dryRun: boolean
}> &
    RecursivePartial<MonodeployConfiguration>): Promise<MonodeployConfiguration> {
    return await mergeDefaultConfig({
        ...rest,
        cwd,
        git: { baseBranch, commitSha, ...rest.git },
        changelogFilename,
        dryRun,
    })
}

export async function writeConfig({
    cwd,
    config,
}: {
    cwd: string
    config: RecursivePartial<MonodeployConfiguration>
}): Promise<string> {
    const monodeployConfigFilename = path.resolve(cwd, 'monodeploy.config.js')
    const configFile = `module.exports = ${JSON.stringify(config)}`
    await fs.writeFile(monodeployConfigFilename, configFile, {
        encoding: 'utf8',
    })
    return monodeployConfigFilename
}

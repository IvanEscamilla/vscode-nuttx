import * as vscode from 'vscode';
import * as cp from 'child_process';
import { CMD_CONFIGURE_LIST, CMD_CUSTOM_CONFIGURE_LIST } from './utils/Consts';
import { ExtensionUtils } from './utils/ExtensionUtils';

export default class Configure {
    RegDisposables: vscode.Disposable[] = [];

    constructor() {
        this.RegDisposables.push(
            vscode.commands.registerCommand(
                CMD_CONFIGURE_LIST, async () => {
                    return await this.configureList();
                }
            )
        );

        this.RegDisposables.push(
            vscode.commands.registerCommand(
                CMD_CUSTOM_CONFIGURE_LIST, async () => {
                    return await this.configureCustomList();
                }
            )
        );
    }

    private async configureList(): Promise<string> {
        ExtensionUtils.showStatusBarLoading("Listing configurations...");
        await ExtensionUtils.delay(200);

        // FIXME: this will not work for multi root workspaces
        // get the workspace folder path
        let cwd = vscode.workspace.rootPath;
        let scriptPath =
            ExtensionUtils.fromSettings<string>("configureScriptPath");
        scriptPath = scriptPath!.replace(
            "${workspaceFolder}",
            cwd!.toString()
        );

        let output = cp.spawnSync(
            scriptPath!,
            [
                "-L"
            ],
            {
                shell: true,
                // FIXME: this will not work with multi-root workspaces
                cwd: vscode.workspace.rootPath
            }
        );

        if (output.pid && output.stdout) {
            // split and trim
            let configurations = output
                .stdout.toString().split("\n")
                .map((item) => item.trim());

            ExtensionUtils.hideStatusBarLoading();

            let configuration = await ExtensionUtils.showInputList(
                configurations,
                "Choose configuration"
            );

            if (configuration) {
                // automatically open the configuration
                const confParts = configuration.split(":");
                const board = confParts[0];
                const conf = confParts[1];

                output = cp.spawnSync(
                    "find",
                    [
                        ".", "-type", "d", "-wholename",
                        `"*/${board}/configs/${conf}"`
                    ],
                    {
                        shell: true,
                        // FIXME: this will not work with multi-root workspaces
                        cwd: vscode.workspace.rootPath
                    }
                );

                const defconfPath =
                    `${vscode.workspace.rootPath}${output.stdout.toString().replace("./", "/").trim()}`;
                const openPath = vscode.Uri.parse(`file://${defconfPath}/defconfig`);

                ExtensionUtils.writeln(`Configuring for ${defconfPath}/defconfig`);

                vscode.workspace.openTextDocument(
                    openPath
                ).then(doc => {
                    vscode.window.showTextDocument(doc, 1, false);
                });

                return configuration;
            } else {
                throw new Error("No configuration selected.");
            }
        }

        ExtensionUtils.hideStatusBarLoading();

        throw new Error("Could not get NuttX configurations list. Did you are with VS Code opened on the NuttX root?");
    }

    private async configureCustomList(): Promise<string> {
        ExtensionUtils.showStatusBarLoading("Listing custom configurations...");
        await ExtensionUtils.delay(200);

        // FIXME: this will not work for multi root workspaces
        // get the workspace folder path
        let cwd = vscode.workspace.rootPath;
        let scriptPath =
            ExtensionUtils.fromSettings<string>("customConfigureScriptPath");
        scriptPath = scriptPath!.replace(
            "${workspaceFolder}",
            cwd!.toString()
        );

        let output = cp.spawnSync(
            scriptPath!,
            [
                "-l"
            ],
            {
                shell: true,
                // FIXME: this will not work with multi-root workspaces
                cwd: vscode.workspace.rootPath
            }
        );

        if (output.pid && output.stdout) {
            // split and trim
            let configurations = output
                .stdout.toString().split("\n")
                .map((item) => item.trim());

            ExtensionUtils.hideStatusBarLoading();

            let configuration = await ExtensionUtils.showInputList(
                configurations,
                "Choose configuration"
            );

            if (configuration) {
                // automatically open the configuration
                const confParts = configuration.split(":");
                const board = confParts[0];
                const conf = confParts[1];

                const result = `BOARDCONFIG=${configuration}`;

                output = cp.spawnSync(
                    "find",
                    [
                        ".", "-type", "d", "-wholename",
                        `"*/${board}/configs/${conf}"`
                    ],
                    {
                        shell: true,
                        // FIXME: this will not work with multi-root workspaces
                        cwd: vscode.workspace.rootPath
                    }
                );

                const defconfPath =
                    `${vscode.workspace.rootPath}${output.stdout.toString().replace("./", "/").trim()}`;
                const openPath = vscode.Uri.parse(`file://${defconfPath}/defconfig`);

                ExtensionUtils.writeln(`Configuring for ${defconfPath}/defconfig`);

                vscode.workspace.openTextDocument(
                    openPath
                ).then(doc => {
                    vscode.window.showTextDocument(doc, 1, false);
                });

                return configuration;
            } else {
                throw new Error("No configuration selected.");
            }
        }

        ExtensionUtils.hideStatusBarLoading();

        throw new Error("Could not get NuttX configurations list. Did you are with VS Code opened on the NuttX root?");
    }
}

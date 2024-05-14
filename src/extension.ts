// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import Utils from "./utils";

const ROOTPATH = "root_path";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "borrowed-time" is now active!');

  // Store the filesystem as a variable for easier reading.
  const fs: vscode.FileSystem = vscode.workspace.fs;

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let helloWorld = vscode.commands.registerCommand(
    "borrowed-time.helloWorld",
    () => {
      // The code you place here will be executed every time your command is executed
      // Display a message box to the user
      vscode.window.showInformationMessage("Hello World from borrowed-time!");
      // Reset `config_path`.
      context.globalState.update("config_path", undefined);
      context.globalState.update(ROOTPATH, undefined);
    }
  );

  let initializeExtension = vscode.commands.registerCommand(
    "borrowed-time.initialize",
    async () => {
      // Initiate the extension.

      // Check if the value exists in the globalState.
      let storedRootPath: vscode.Uri | undefined =
        context.globalState.get<vscode.Uri>(ROOTPATH);
      // Check if the value exists or if it's undefined.
      if (storedRootPath === undefined) {
        // We don't have this path so we assume we're starting from scratch.

        // Ask the user for the root path, where every project is stored.
        const rootPath = await vscode.window.showInputBox({
          placeHolder: "",
          prompt: "Enter root's absolute path, don't use ~.",
          // Do not let user input an empty name.
          validateInput: (text) => {
            if (text !== "") return null;
            else {
              return "Path cannot be empty";
            }
          },
        });

        // If the path is undefined, return with an error.
        if (rootPath === undefined) {
          vscode.window.showErrorMessage("Root path cannot be undefined.");
          return;
        }

        const rootUri = vscode.Uri.file(rootPath);
        console.log(rootUri.fsPath);

        // Create the rootPath message.
        const rootPathMessage: string = "Created root path at: " + rootPath;

        // Create the rootPath directory.
        fs.createDirectory(rootUri).then(() => {
          vscode.window.showInformationMessage(rootPathMessage);
          console.log(rootPathMessage);

          // Add this to the storage so we do not create it again.
          context.globalState.update(ROOTPATH, rootUri).then(() => {
            console.log(
              "Created root_path in the globalState with value: " +
                rootUri.toString()
            );
          });
        });
      } else {
        console.log("Found root_path in globalState: " + storedRootPath.path);
        // Check if root_path exists.
        if (await Utils.fileExists(storedRootPath)) {
          // If we're here, the path exists, do nothing.
          console.log(
            "No initialization needed. Root path exists at: " +
              storedRootPath.path
          );
        } else {
          // The path does not exist, create it.
          const rootPathMessage: string =
            "Created root path at: " + storedRootPath;
          fs.createDirectory(storedRootPath).then(() => {
            vscode.window.showInformationMessage(rootPathMessage);
            console.log(rootPathMessage);
          });
        }
      }
    }
  );

  let newProject = vscode.commands.registerCommand(
    "borrowed-time.new-project",
    async () => {
      const rootPath = Utils.isInstalled(context);
      // We have already printed the message, we can just return here.
      if (rootPath === undefined) return;

      // Get project name from the user.
      const projectName = await vscode.window.showInputBox({
        placeHolder: "",
        prompt: "New Project's Name",
        // Do not let user input an empty project name.
        validateInput: (text) => {
          if (text !== "") return null;
          else {
            return "Please enter a project name";
          }
        },
      });
      if (projectName === undefined) {
        vscode.window.showErrorMessage("Project name cannot be undefined.");
        return;
      }

      const projectPath = vscode.Uri.joinPath(rootPath, projectName);

      if (await Utils.fileExists(projectPath)) {
        // Return with an error because we do not want to overwrite projects.
        vscode.window.showErrorMessage(
          "Project exists at: " + projectPath.fsPath
        );
        return;
      } else {
        // Directory doesn't exist, we can create it.
        fs.createDirectory(projectPath).then(() => {
          fs.createDirectory(projectPath).then(() => {
            const msg = "Created project directory at: " + projectPath.fsPath;
            console.log(msg);
            vscode.window.showInformationMessage(msg);

            // Populate the project. ZZZ
          });
        });
      }
    }
  );

  // List existing projects.
  let listProjects = vscode.commands.registerCommand(
    "borrowed-time.list-projects",
    async () => {
      // Check if extension is installed and return if it's not.
      const rootPath = Utils.isInstalled(context);
      if (rootPath === undefined) return;

      // List all the top level directories in rootPath.
      const projects = await Utils.listProjects(rootPath);
      console.log("Existing projects: " + rootPath.path);
      projects.forEach((p) => {
        console.log(`* ${p}`);
      });
    }
  );

  // Open an existing project.
  let openProject = vscode.commands.registerCommand(
    "borrowed-time.open-project",
    async () => {
      // Check if extension is installed and return if it's not.
      const rootPath = Utils.isInstalled(context);
      if (rootPath === undefined) return;

      const allProjects: vscode.QuickPickItem[] = [];

      // List all the top level directories in rootPath.
      const projects = await Utils.listProjects(rootPath);
      projects.forEach((p) => {
        allProjects.push({ label: p.toString() });
      });

      vscode.window.showQuickPick(allProjects).then((selection) => {
        if (selection === undefined) {
          console.log("Nothing was selected in the open project dialog.");
          return;
        }
        // Create the complete path. rootPath + selection.
        const projectPath = vscode.Uri.joinPath(rootPath, selection.label);
        console.log("Opening new project at: " + projectPath.path);
        // Using the built-in command. See all at:
        // https://code.visualstudio.com/api/references/commands.
        vscode.commands.executeCommand("vscode.openFolder", projectPath, {
          forceNewWindow: true,
        });

        // This will have problems because the scheme is "vscode-remote" and
        // Windows will complain about not having any apps to open it.
        // vscode.env.openExternal(projectPath);
      });
    }
  );

  context.subscriptions.push(
    helloWorld,
    newProject,
    initializeExtension,
    listProjects,
    openProject
  );
}

// This method is called when your extension is deactivated
export function deactivate() {}

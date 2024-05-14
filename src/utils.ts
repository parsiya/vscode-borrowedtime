import * as vscode from "vscode";

export default class Utils {
  static async fileExists(uri: vscode.Uri): Promise<boolean> {
    try {
      await vscode.workspace.fs.stat(uri);
      return true; // File exists
    } catch {
      return false; // File does not exist
    }
  }

  // isInstalled checks if the root_path key exists in globalStorage. If so, it
  // will return it. If not (it will print error messages) and return undefined.
  static isInstalled(context: vscode.ExtensionContext): vscode.Uri | undefined {
    const rootPath = context.globalState.get<vscode.Uri>("root_path");
    // If rootPath is undefined, we need to initialize the extension.
    if (rootPath === undefined) {
      console.log(
        "root_path does not exist in globalState. You must initialize the extension first."
      );
      vscode.window.showErrorMessage(
        "You must initialize the extension first."
      );
      return rootPath;
    }
    // Create a new vscode.Uri object from rootPath because the one retrieved
    // from globalState is not complete. E.g., it will return an error "s.with
    // is not a function" when using vscode.Uri.joinPath.
    return vscode.Uri.from({
      scheme: rootPath.scheme,
      authority: rootPath.authority,
      path: rootPath.path,
    });
  }

  //
  static async listProjects(rootPath: vscode.Uri): Promise<String[]> {
    // List all the top level directories in rootPath.
    let projects: string[] = [];

    const everything = await vscode.workspace.fs.readDirectory(rootPath);

    everything.forEach((element) => {
      // element: [string (name), FileType]
      // Ignoring symlinks, we only care about FileType.Directory.
      if (element[1] === vscode.FileType.Directory) projects.push(element[0]);
    });

    return projects;
  }
}

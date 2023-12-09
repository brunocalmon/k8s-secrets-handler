import * as vscode from 'vscode';
import * as yaml from 'js-yaml';
import * as base64 from 'js-base64';

export function activate(context: vscode.ExtensionContext) {

  let conversionDisposable = vscode.commands.registerCommand('extension.convertFormat', () => {
    const editor = vscode.window.activeTextEditor;
    const text = extractTextFromDocument(extractDocumentFromEditor(editor));
    convertFormat(editor, findTextFormat(text));
  });

  let encodeDisposable = vscode.commands.registerCommand('extension.encodeFile', () => {
    const editor = vscode.window.activeTextEditor;
    const text = extractTextFromDocument(extractDocumentFromEditor(editor));
    switch (findTextFormat(text)) {
      case 'yaml':
        processYaml(editor, encodeDataToBase64);
        break;
      case 'json':
        processJson(editor, encodeDataToBase64);
        break;
      default:
        console.log('Unsupported document text format');
        break;
    }
  });

  let decodeDisposable = vscode.commands.registerCommand('extension.decodeFile', () => {
    const editor = vscode.window.activeTextEditor;
    const text = extractTextFromDocument(extractDocumentFromEditor(editor));
    switch (findTextFormat(text)) {
      case 'yaml':
        processYaml(editor, decodeDataFromBase64);
        break;
      case 'json':
        processJson(editor, decodeDataFromBase64);
        break;
      default:
        console.log('Unsupported document text format');
        break;
    }

  });

  context.subscriptions.push(conversionDisposable, encodeDisposable, decodeDisposable);
}

function extractDocumentFromEditor(editor: any): any {
  if (editor) {
    return editor.document;
  }
}

function extractTextFromDocument(document: any): any {
  if (document) {
    const text = document.getText();
    return text;
  }
}

function convertFormat(editor: vscode.TextEditor | undefined, type: string): void {
  if (editor) {
    try {
      const document = extractDocumentFromEditor(editor);
      const text = extractTextFromDocument(document);
      var processed = '';
      switch (type) {
        case 'json':
          const jsonObj = JSON.parse(text);
          processed = yaml.dump(jsonObj);
          break;
        case 'yaml':
          const yamlObj = yaml.load(text);
          processed = JSON.stringify(yamlObj, null, 2);
          break;
      }

      // Update the content in the document
      editor.edit((editBuilder) => {
        const fullRange = new vscode.Range(
          document.positionAt(0),
          document.positionAt(text.length)
        );
        editBuilder.replace(fullRange, processed);
      });

      vscode.window.showInformationMessage('File converted and updated!');
    } catch (error: any) {
      vscode.window.showErrorMessage('Error processing File: ' + error.message);
    }
  }
}

function processYaml(editor: vscode.TextEditor | undefined, processor: (obj: any) => any): void {
  if (editor) {
    try {
      const document = extractDocumentFromEditor(editor);
      const text = extractTextFromDocument(document);

      const yamlObj = yaml.load(text);
      const processed = yaml.dump(processor(yamlObj));

      // Update the content in the document
      editor.edit((editBuilder) => {
        const fullRange = new vscode.Range(
          document.positionAt(0),
          document.positionAt(text.length)
        );
        editBuilder.replace(fullRange, processed);
      });

      vscode.window.showInformationMessage('YAML processed and updated!');
    } catch (error: any) {
      vscode.window.showErrorMessage('Error processing YAML: ' + error.message);
    }
  }
}

function processJson(editor: vscode.TextEditor | undefined, processor: (obj: any) => any): void {
  if (editor) {
    try {
      const document = extractDocumentFromEditor(editor);
      const text = extractTextFromDocument(document);

      const jsonObj = JSON.parse(text);
      const processed = JSON.stringify(processor(jsonObj), null, 2);

      // Update the content in the document
      editor.edit((editBuilder) => {
        const fullRange = new vscode.Range(
          document.positionAt(0),
          document.positionAt(text.length)
        );
        editBuilder.replace(fullRange, processed);
      });

      vscode.window.showInformationMessage('JSON processed and updated!');
    } catch (error: any) {
      vscode.window.showErrorMessage('Error processing JSON: ' + error.message);
    }
  }
}

function findTextFormat(text: string): string {
  if (isJsonText(text)) { return 'json'; }
  if (isYamlText(text)) { return 'yaml'; }
  return 'unsupported';
}

function isJsonText(text: string): boolean {
  try {
    JSON.parse(text);
  }
  catch (e) {
    return false;
  }
  return true;
}

function isYamlText(text: string): boolean {
  try {
    yaml.load(text)
  }
  catch (e) {
    return false;
  }
  return true;
}

function encodeDataToBase64(obj: any): string {
  if (obj && obj.data) {
    for (const key in obj.data) {
      if (Object.prototype.hasOwnProperty.call(obj.data, key)) {
        const value = obj.data[key];
        if (typeof value === 'string') {
          obj.data[key] = base64.encode(value);
        }
      }
    }
  }

  return obj;
}

function decodeDataFromBase64(obj: any): string {
  if (obj && obj.data) {
    for (const key in obj.data) {
      if (Object.prototype.hasOwnProperty.call(obj.data, key)) {
        const value = obj.data[key];
        if (typeof value === 'string') {
          try {
            obj.data[key] = base64.decode(value);
          } catch (error: any) {
            vscode.window.showWarningMessage(`Error decoding base64 for key '${key}': ${error.message}`);
          }
        }
      }
    }
  }

  return obj;
}

export function deactivate() { }

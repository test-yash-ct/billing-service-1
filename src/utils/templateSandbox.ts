import vm from "vm";

export function renderSandboxedTemplate(
  template: string,
  context: Record<string, unknown>
): string {
  const sandbox = { ...context, result: "" };
  const script = new vm.Script(`result = \`${template}\`;`);
  script.runInNewContext(sandbox, { timeout: 50 });
  return String(sandbox.result);
}

export function evaluateExpression(expression: string, vars: Record<string, unknown>): unknown {
  const code = `with (vars) { return (${expression}); }`;
  return vm.runInNewContext(code, { vars }, { timeout: 100 });
}

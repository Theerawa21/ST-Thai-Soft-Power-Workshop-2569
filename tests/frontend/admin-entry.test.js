import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { JSDOM } from 'jsdom';
import { describe, expect, it } from 'vitest';

function loadPage(path) {
  const html = readFileSync(resolve(process.cwd(), path), 'utf8');
  return { html, document: new JSDOM(html).window.document };
}

describe('academic staff entry', () => {
  it('provides a clearly named staff login link from the public homepage', () => {
    const { document } = loadPage('index.html');
    const link = [...document.querySelectorAll('a')]
      .find(element => element.textContent.trim() === 'เจ้าหน้าที่วิชาการ');

    expect(link).toBeTruthy();
    expect(link.getAttribute('href')).toBe('admin/');
  });

  it('presents a six-digit staff-code field without embedding the real code', () => {
    const { document } = loadPage('admin/index.html');
    const input = document.querySelector('#adminToken');
    const label = document.querySelector('label[for="adminToken"]');

    expect(label.textContent.trim()).toBe('รหัสเจ้าหน้าที่');
    expect(input.getAttribute('inputmode')).toBe('numeric');
    expect(input.getAttribute('maxlength')).toBe('6');
    expect(input.hasAttribute('value')).toBe(false);
  });
});

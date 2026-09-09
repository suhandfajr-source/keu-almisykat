import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { validateLogoFile, saveLogoFile, BRANDING_BUCKET, MAX_LOGO_SIZE } from '../src/lib/storage';
import { FinanceRepository } from '../src/lib/db/engine';

describe('Branding Storage & Logo Management Tests', () => {
  let repo: FinanceRepository;

  beforeEach(() => {
    repo = new FinanceRepository();
    repo.resetDataForTesting();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('validates logo formats and file size limits (<= 5MB)', () => {
    expect(validateLogoFile({ name: 'logo.png', size: 1024, type: 'image/png' }).valid).toBe(true);
    expect(validateLogoFile({ name: 'logo.svg', size: 2048, type: 'image/svg+xml' }).valid).toBe(true);
    expect(validateLogoFile({ name: 'logo.jpg', size: 4096, type: 'image/jpeg' }).valid).toBe(true);
    expect(validateLogoFile({ name: 'logo.webp', size: 4096, type: 'image/webp' }).valid).toBe(true);

    // Invalid format
    const invalidExt = validateLogoFile({ name: 'document.pdf', size: 1024, type: 'application/pdf' });
    expect(invalidExt.valid).toBe(false);
    expect(invalidExt.error).toContain('Format logo .pdf tidak didukung');

    // Exceeds 5MB
    const oversized = validateLogoFile({ name: 'huge_logo.png', size: MAX_LOGO_SIZE + 1, type: 'image/png' });
    expect(oversized.valid).toBe(false);
    expect(oversized.error).toContain('melebihi batas maksimal 5 MB');
  });

  it('guarantees app_settings can store, retrieve, and update app_logo_path, app_name, and app_subtitle', async () => {
    expect(repo.getSetting('app_logo_path')).toBeNull();
    expect(repo.getSetting('app_name')).toBeNull();
    expect(repo.getSetting('app_subtitle')).toBeNull();

    // Set custom app identity
    repo.setSetting('app_name', 'Yayasan Al-Misykat', 'prof-admin');
    repo.setSetting('app_subtitle', 'Sistem Keuangan Pesantren', 'prof-admin');
    repo.setSetting('app_logo_path', 'https://supabase.co/storage/v1/object/public/app-branding/branding/logo/test.png', 'prof-admin');

    expect(repo.getSetting('app_name')).toBe('Yayasan Al-Misykat');
    expect(repo.getSetting('app_subtitle')).toBe('Sistem Keuangan Pesantren');
    expect(repo.getSetting('app_logo_path')).toBe('https://supabase.co/storage/v1/object/public/app-branding/branding/logo/test.png');

    // Replace
    repo.setSetting('app_logo_path', 'https://supabase.co/storage/v1/object/public/app-branding/branding/logo/new_logo.png', 'prof-admin');
    expect(repo.getSetting('app_logo_path')).toBe('https://supabase.co/storage/v1/object/public/app-branding/branding/logo/new_logo.png');

    // Remove logo
    repo.setSetting('app_logo_path', '', 'prof-admin');
    expect(repo.getSetting('app_logo_path')).toBe('');
  });

  it('in Supabase mode: throws an error on storage failure and NEVER falls back to local disk', async () => {
    // Setup env to Supabase mode
    const originalDriver = process.env.STORAGE_DRIVER;
    const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const originalKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    process.env.STORAGE_DRIVER = 'supabase';
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://fake-project.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'fake-anon-key';

    const brandingLocalDir = path.join(process.cwd(), 'public', 'branding');
    const existingFilesBefore = fs.existsSync(brandingLocalDir) ? fs.readdirSync(brandingLocalDir) : [];

    const dummyBuffer = Buffer.from('fake-image-bytes');

    // When Supabase upload fails in Supabase mode, it must reject/throw and NOT create local files
    await expect(saveLogoFile(dummyBuffer, 'test_logo.png', 'image/png')).rejects.toThrow(
      'Logo gagal disimpan'
    );

    const existingFilesAfter = fs.existsSync(brandingLocalDir) ? fs.readdirSync(brandingLocalDir) : [];
    expect(existingFilesAfter.length).toBe(existingFilesBefore.length);

    // Restore env
    process.env.STORAGE_DRIVER = originalDriver;
    process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalKey;
  });

  it('in explicit local mode: saves logo to local branding folder', async () => {
    const originalDriver = process.env.STORAGE_DRIVER;
    process.env.STORAGE_DRIVER = 'local';

    const dummyBuffer = Buffer.from('local-image-bytes');
    const result = await saveLogoFile(dummyBuffer, 'unit_test_logo.png', 'image/png');

    expect(result.filePath).toMatch(/^\/branding\/logo_\d+_unit_test_logo\.png$/);

    const fullPath = path.join(process.cwd(), 'public', result.filePath);
    expect(fs.existsSync(fullPath)).toBe(true);

    // Cleanup local test file
    fs.unlinkSync(fullPath);

    process.env.STORAGE_DRIVER = originalDriver;
  });
});

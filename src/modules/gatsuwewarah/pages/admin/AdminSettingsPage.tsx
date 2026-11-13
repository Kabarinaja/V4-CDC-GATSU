import React, { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { RichHtmlEditor } from '../../components/RichHtmlEditor';
import { useDocumentHead } from '../../lib/useDocumentHead';
import { savePortalSettingsAdmin } from '../../services/firestoreService';
import type { PortalSettings } from '../../types';

interface AdminSettingsPageProps {
  settings: PortalSettings;
  onRefresh: () => Promise<void>;
}

export const AdminSettingsPage: React.FC<AdminSettingsPageProps> = ({
  settings,
  onRefresh,
}) => {
  const [form, setForm] = useState<Omit<PortalSettings, 'updatedAt'>>({
    siteName: settings.siteName,
    tagline: settings.tagline,
    breakingLabel: settings.breakingLabel,
    contactEmail: settings.contactEmail,
    contactPhone: settings.contactPhone,
    officeAddress: settings.officeAddress,
    editorialAboutHtml: settings.editorialAboutHtml,
    editorialContactHtml: settings.editorialContactHtml,
    privacyPolicyHtml: settings.privacyPolicyHtml,
    cyberMediaGuidelinesHtml: settings.cyberMediaGuidelinesHtml,
  });
  const [activeDocTab, setActiveDocTab] = useState<
    'about' | 'contact' | 'privacy' | 'cyber'
  >('about');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useDocumentHead({
    title: 'Pengaturan Portal — Meja Redaksi GATSU WEWARAH',
    description: 'Kelola identitas redaksi dan halaman informasi GATSU WEWARAH.',
  });

  useEffect(() => {
    setForm({
      siteName: settings.siteName,
      tagline: settings.tagline,
      breakingLabel: settings.breakingLabel,
      contactEmail: settings.contactEmail,
      contactPhone: settings.contactPhone,
      officeAddress: settings.officeAddress,
      editorialAboutHtml: settings.editorialAboutHtml,
      editorialContactHtml: settings.editorialContactHtml,
      privacyPolicyHtml: settings.privacyPolicyHtml,
      cyberMediaGuidelinesHtml: settings.cyberMediaGuidelinesHtml,
    });
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await savePortalSettingsAdmin(form);
      await onRefresh();
      setMessage('Pengaturan portal dan halaman redaksi berhasil disimpan.');
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : 'Gagal menyimpan pengaturan.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-300 pb-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-neutral-950">
            Pengaturan Portal
          </h1>
          <p className="text-sm text-stone-600 mt-1">
            Perbarui informasi redaksi, kontak, serta halaman kebijakan media siber.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider bg-neutral-950 text-white hover:bg-neutral-800 inline-flex items-center gap-2 disabled:opacity-60"
        >
          <Save className="w-3.5 h-3.5" />
          {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
        </button>
      </div>

      {message && (
        <div className="p-3 bg-white border border-stone-300 text-xs font-medium text-neutral-800">
          {message}
        </div>
      )}

      <div className="bg-white border border-stone-300 p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="set-sitename"
            className="block text-xs font-semibold text-neutral-700 mb-1"
          >
            Nama Portal
          </label>
          <input
            id="set-sitename"
            type="text"
            required
            value={form.siteName}
            onChange={(e) => setForm({ ...form, siteName: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-stone-300 focus:outline-none focus:border-neutral-950"
          />
        </div>

        <div>
          <label
            htmlFor="set-tagline"
            className="block text-xs font-semibold text-neutral-700 mb-1"
          >
            Tagline
          </label>
          <input
            id="set-tagline"
            type="text"
            required
            value={form.tagline}
            onChange={(e) => setForm({ ...form, tagline: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-stone-300 focus:outline-none focus:border-neutral-950"
          />
        </div>

        <div>
          <label
            htmlFor="set-breaking"
            className="block text-xs font-semibold text-neutral-700 mb-1"
          >
            Label Breaking News
          </label>
          <input
            id="set-breaking"
            type="text"
            required
            value={form.breakingLabel}
            onChange={(e) => setForm({ ...form, breakingLabel: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-stone-300 focus:outline-none focus:border-neutral-950"
          />
        </div>

        <div>
          <label
            htmlFor="set-email"
            className="block text-xs font-semibold text-neutral-700 mb-1"
          >
            Email Redaksi
          </label>
          <input
            id="set-email"
            type="email"
            required
            value={form.contactEmail}
            onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-stone-300 focus:outline-none focus:border-neutral-950"
          />
        </div>

        <div className="sm:col-span-2">
          <label
            htmlFor="set-address"
            className="block text-xs font-semibold text-neutral-700 mb-1"
          >
            Alamat Kantor Redaksi
          </label>
          <input
            id="set-address"
            type="text"
            required
            value={form.officeAddress}
            onChange={(e) => setForm({ ...form, officeAddress: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-stone-300 focus:outline-none focus:border-neutral-950"
          />
        </div>
      </div>

      {/* Editorial Static Pages Editor */}
      <div className="bg-white border border-stone-300 p-5 space-y-4">
        <div className="flex flex-wrap items-center gap-2 border-b border-stone-200 pb-3">
          {[
            { key: 'about', label: 'Tentang Redaksi' },
            { key: 'contact', label: 'Kontak Redaksi' },
            { key: 'privacy', label: 'Kebijakan Privasi' },
            { key: 'cyber', label: 'Pedoman Media Siber' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() =>
                setActiveDocTab(
                  tab.key as 'about' | 'contact' | 'privacy' | 'cyber'
                )
              }
              className={`px-3.5 py-2 text-xs font-semibold transition-colors ${
                activeDocTab === tab.key
                  ? 'bg-neutral-950 text-white'
                  : 'bg-stone-100 text-neutral-700 hover:bg-stone-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeDocTab === 'about' && (
          <RichHtmlEditor
            value={form.editorialAboutHtml}
            onChange={(html) => setForm({ ...form, editorialAboutHtml: html })}
          />
        )}
        {activeDocTab === 'contact' && (
          <RichHtmlEditor
            value={form.editorialContactHtml}
            onChange={(html) => setForm({ ...form, editorialContactHtml: html })}
          />
        )}
        {activeDocTab === 'privacy' && (
          <RichHtmlEditor
            value={form.privacyPolicyHtml}
            onChange={(html) => setForm({ ...form, privacyPolicyHtml: html })}
          />
        )}
        {activeDocTab === 'cyber' && (
          <RichHtmlEditor
            value={form.cyberMediaGuidelinesHtml}
            onChange={(html) =>
              setForm({ ...form, cyberMediaGuidelinesHtml: html })
            }
          />
        )}
      </div>
    </form>
  );
};

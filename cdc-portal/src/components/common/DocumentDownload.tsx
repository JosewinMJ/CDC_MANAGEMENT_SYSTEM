import { useState } from 'react';
import { downloadApiFile, type PortalScope } from '../../services/apiClient';

export function DocumentDownload({ path, name, portal }: { path: string; name: string; portal: PortalScope }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  if (!/^\/documents\/\d+\/file$/.test(path)) {
    if (!/^\/(uploads|storage)\/[^\\]+$/.test(path) && !/^https:\/\//i.test(path)) return <span>File unavailable</span>;
    return <a className="text-sm font-semibold text-[#2855A6]" href={path} target="_blank" rel="noreferrer">Open file</a>;
  }
  async function download() {
    setBusy(true);
    setError('');
    try { await downloadApiFile(path, name, portal); }
    catch { setError('File unavailable. Please try again.'); }
    finally { setBusy(false); }
  }
  return <span><button type="button" disabled={busy} className="text-sm font-semibold text-[#2855A6]" onClick={download}>{busy ? 'Downloading…' : 'Download file'}</button>
    {error && <span role="alert" className="block text-xs text-rose-700">{error}</span>}</span>;
}

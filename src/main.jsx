import React, { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { PDFDocument } from 'pdf-lib';
import {
  ArrowDown, ArrowDownToLine, ArrowRight, ArrowUp, Check, ChevronDown, FileImage,
  FileText, GripVertical, ImagePlus, Layers3, LockKeyhole, Menu, MoveDown, Plus,
  RefreshCw, ShieldCheck, Sparkles, Trash2, UploadCloud, X, Zap
} from 'lucide-react';
import './styles.css';

const fmtBytes = (bytes) => bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

function App() {
  const [images, setImages] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [pageSize, setPageSize] = useState('A4');
  const [orientation, setOrientation] = useState('Portrait');
  const [margin, setMargin] = useState('Normal');
  const [quality, setQuality] = useState('High');
  const [filename, setFilename] = useState('my-images');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const inputRef = useRef(null);
  const dragIndex = useRef(null);

  const addFiles = (fileList) => {
    const selected = Array.from(fileList || []).filter(f => /^image\/(jpeg|jpg|png|webp)$/i.test(f.type));
    if (!selected.length) { setNotice('Choose JPG, PNG, or WebP image files to continue.'); return; }
    const mapped = selected.map(file => ({ id: `${file.name}-${file.size}-${Math.random()}`, file, url: URL.createObjectURL(file), name: file.name }));
    setImages(prev => [...prev, ...mapped]);
    setNotice('');
  };
  const removeImage = (id) => {
    setImages(prev => { const found = prev.find(i => i.id === id); if (found) URL.revokeObjectURL(found.url); return prev.filter(i => i.id !== id); });
  };
  const clearAll = () => { images.forEach(i => URL.revokeObjectURL(i.url)); setImages([]); setNotice(''); };
  const moveImage = (index, delta) => setImages(prev => {
    const next = [...prev], target = index + delta;
    if (target < 0 || target >= next.length) return prev;
    [next[index], next[target]] = [next[target], next[index]];
    return next;
  });
  const reorder = (toIndex) => setImages(prev => {
    const from = dragIndex.current;
    if (from == null || from === toIndex) return prev;
    const next = [...prev], [item] = next.splice(from, 1); next.splice(toIndex, 0, item);
    dragIndex.current = null; return next;
  });

  const convert = async () => {
    if (!images.length || busy) return;
    setBusy(true); setNotice('');
    try {
      const pdf = await PDFDocument.create();
      const dimensions = pageSize === 'A4' ? [595.28, 841.89] : pageSize === 'Letter' ? [612, 792] : [841.89, 1190.55];
      const marginPts = margin === 'None' ? 0 : margin === 'Small' ? 18 : margin === 'Wide' ? 48 : 30;
      for (const item of images) {
        const bytes = await item.file.arrayBuffer();
        let embedded;
        if (item.file.type === 'image/png') embedded = await pdf.embedPng(bytes);
        else if (item.file.type === 'image/jpeg' || item.file.type === 'image/jpg') embedded = await pdf.embedJpg(bytes);
        else {
          // Convert WebP (and other browser-readable formats) to JPEG in-browser.
          const bitmap = await createImageBitmap(item.file);
          const canvas = document.createElement('canvas');
          canvas.width = bitmap.width; canvas.height = bitmap.height;
          canvas.getContext('2d').drawImage(bitmap, 0, 0);
          const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality === 'Standard' ? 0.78 : 0.94));
          embedded = await pdf.embedJpg(await blob.arrayBuffer());
          bitmap.close();
        }
        let [pw, ph] = dimensions;
        if (orientation === 'Landscape') [pw, ph] = [ph, pw];
        const page = pdf.addPage([pw, ph]);
        const availableW = pw - marginPts * 2, availableH = ph - marginPts * 2;
        const scale = Math.min(availableW / embedded.width, availableH / embedded.height);
        const w = embedded.width * scale, h = embedded.height * scale;
        page.drawImage(embedded, { x: (pw - w) / 2, y: (ph - h) / 2, width: w, height: h });
      }
      const bytes = await pdf.save({ useObjectStreams: true });
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${(filename.trim() || 'my-images').replace(/\.pdf$/i, '')}.pdf`;
      link.click(); URL.revokeObjectURL(link.href);
      setNotice(`Your PDF is ready — ${images.length} image${images.length === 1 ? '' : 's'} combined into one file.`);
    } catch (e) {
      console.error(e); setNotice('Something went wrong while creating the PDF. Try a different image or format.');
    } finally { setBusy(false); }
  };

  return <div className="app-shell">
    <div className="top-glow" />
    <header className="nav container">
      <a className="brand" href="#" aria-label="Pixora home"><span className="brand-mark"><Layers3 size={21}/></span><span>pixora<span className="brand-dot">.</span></span></a>
      <nav className="nav-links"><a href="#how-it-works">How it works</a><a href="#features">Features</a><span className="secure"><LockKeyhole size={14}/> 100% private</span></nav>
      <button className="nav-cta" onClick={() => inputRef.current?.click()}>Start converting <ArrowRight size={16}/></button>
    </header>

    <main>
      <section className="hero container">
        <div className="eyebrow"><span className="eyebrow-pulse"/> THE SIMPLE WAY TO MAKE PDFS</div>
        <h1>Your images.<br/><span>One beautiful PDF.</span></h1>
        <p className="hero-copy">Turn JPGs, PNGs, and more into a single, share-ready PDF in seconds. Simple, secure, and completely free.</p>
        <div className="hero-points"><span><Check size={15}/> Multiple images</span><span><Check size={15}/> No sign-up</span><span><Check size={15}/> Files stay on your device</span></div>
      </section>

      <section className="workspace container" aria-label="Image to PDF converter">
        <div className="workspace-head">
          <div><div className="step-label"><span>01</span> YOUR FILES</div><h2>Build your PDF</h2><p className="subhead">Add images, arrange the order, then customize your document.</p></div>
          <div className="file-count"><FileImage size={16}/><strong>{images.length}</strong> {images.length === 1 ? 'image' : 'images'}</div>
        </div>

        <div className={`dropzone ${dragging ? 'is-dragging' : ''} ${images.length ? 'compact-drop' : ''}`}
          onDragOver={e => {e.preventDefault(); setDragging(true);}}
          onDragLeave={() => setDragging(false)}
          onDrop={e => {e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files);}}>
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" multiple hidden onChange={e => {addFiles(e.target.files); e.target.value = '';}} />
          <div className="upload-icon"><UploadCloud size={25}/></div>
          <div className="drop-copy"><h3>{images.length ? 'Add more images' : 'Drop your images here'}</h3><p>or <button className="inline-link" onClick={() => inputRef.current?.click()}>browse files</button> from your device</p><span className="file-types">JPG · JPEG · PNG · WEBP</span></div>
          <button className="choose-btn" onClick={() => inputRef.current?.click()}><Plus size={17}/> Choose images</button>
        </div>

        {notice && <div className={`notice ${notice.startsWith('Something') || notice.startsWith('Choose') ? 'notice-error' : ''}`} role="status"><span>{notice.startsWith('Something') || notice.startsWith('Choose') ? '!' : '✓'}</span>{notice}<button aria-label="Dismiss message" onClick={() => setNotice('')}><X size={15}/></button></div>}

        {images.length > 0 && <div className="image-area">
          <div className="list-heading"><div><strong>Your images</strong><span>Drag to reorder pages</span></div><button className="text-button" onClick={clearAll}><Trash2 size={14}/> Clear all</button></div>
          <div className="image-grid">
            {images.map((img, i) => <div className="image-card" key={img.id} draggable onDragStart={() => {dragIndex.current = i;}} onDragOver={e => e.preventDefault()} onDrop={e => {e.preventDefault(); reorder(i);}} onDragEnd={() => {dragIndex.current = null;}}>
              <div className="thumb-wrap"><img src={img.url} alt={img.name}/><span className="page-number">{String(i + 1).padStart(2, '0')}</span><button className="remove-image" aria-label={`Remove ${img.name}`} onClick={() => removeImage(img.id)}><X size={15}/></button></div>
              <div className="image-meta"><span className="image-name" title={img.name}>{img.name}</span><span>{fmtBytes(img.file.size)}</span></div>
              <div className="reorder-controls"><button aria-label="Move image up" disabled={i === 0} onClick={() => moveImage(i, -1)}><ArrowUp size={14}/></button><span>Page {i + 1}</span><button aria-label="Move image down" disabled={i === images.length - 1} onClick={() => moveImage(i, 1)}><ArrowDown size={14}/></button><GripVertical className="grip" size={15}/></div>
            </div>)}
            <button className="add-more-card" onClick={() => inputRef.current?.click()}><span><Plus size={22}/></span><strong>Add images</strong><small>Keep building your PDF</small></button>
          </div>
        </div>}

        <div className="settings">
          <div className="settings-title"><div className="step-label"><span>02</span> DOCUMENT SETTINGS</div><span className="optional">Customize your output</span></div>
          <div className="settings-grid">
            <label className="setting-field"><span>Page size</span><div className="select-wrap"><select value={pageSize} onChange={e => setPageSize(e.target.value)}><option>A4</option><option>Letter</option><option>A3</option></select><ChevronDown size={16}/></div></label>
            <label className="setting-field"><span>Orientation</span><div className="segmented"><button className={orientation === 'Portrait' ? 'selected' : ''} onClick={() => setOrientation('Portrait')}><span className="orientation-icon portrait-icon"/>Portrait</button><button className={orientation === 'Landscape' ? 'selected' : ''} onClick={() => setOrientation('Landscape')}><span className="orientation-icon landscape-icon"/>Landscape</button></div></label>
            <label className="setting-field"><span>Page margins</span><div className="select-wrap"><select value={margin} onChange={e => setMargin(e.target.value)}><option>Normal</option><option>Small</option><option>Wide</option><option>None</option></select><ChevronDown size={16}/></div></label>
            <label className="setting-field"><span>Image quality</span><div className="select-wrap"><select value={quality} onChange={e => setQuality(e.target.value)}><option>High</option><option>Standard</option></select><ChevronDown size={16}/></div></label>
          </div>
          <label className="filename-field"><span>PDF file name</span><div className="filename-input"><FileText size={17}/><input value={filename} onChange={e => setFilename(e.target.value)} placeholder="my-images"/><span>.pdf</span></div></label>
        </div>

        <div className="convert-footer"><div className="privacy-note"><span className="privacy-icon"><ShieldCheck size={18}/></span><div><strong>Your files never leave your device</strong><small>Conversion happens locally in your browser.</small></div></div><button className="convert-btn" disabled={!images.length || busy} onClick={convert}>{busy ? <><RefreshCw className="spin" size={18}/> Creating PDF…</> : <><Sparkles size={17}/> Convert to PDF <ArrowRight size={17}/></>}</button></div>
      </section>

      <section className="trust-strip container" id="features"><div><span className="trust-icon"><Zap size={18}/></span><div><strong>Fast by design</strong><small>Convert in just a few clicks</small></div></div><div><span className="trust-icon"><LockKeyhole size={18}/></span><div><strong>Private & secure</strong><small>Your files stay on your device</small></div></div><div><span className="trust-icon"><Layers3 size={18}/></span><div><strong>One tidy PDF</strong><small>Combine images in your order</small></div></div></section>

      <section className="how-section container" id="how-it-works"><div className="section-kicker">MADE TO BE EASY</div><h2>From images to PDF.<br/><span>Just like that.</span></h2><div className="how-grid"><article><span className="how-num">01</span><div className="how-icon"><ImagePlus size={22}/></div><h3>Upload images</h3><p>Select multiple JPG, PNG, or WebP files, or simply drag them into the workspace.</p></article><article><span className="how-num">02</span><div className="how-icon"><MoveDown size={22}/></div><h3>Make it yours</h3><p>Arrange pages in your preferred order and choose page size, orientation, and margins.</p></article><article><span className="how-num">03</span><div className="how-icon"><ArrowDownToLine size={22}/></div><h3>Download PDF</h3><p>Convert everything into one clean PDF and save it straight to your device.</p></article></div></section>
    </main>
    <footer className="footer"><div className="container footer-inner"><a className="brand" href="#"><span className="brand-mark"><Layers3 size={19}/></span><span>pixora<span className="brand-dot">.</span></span></a><span>Simple tools. More time for what matters.</span><span className="footer-right">Made for your workflow <span>✦</span></span></div></footer>
  </div>;
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);

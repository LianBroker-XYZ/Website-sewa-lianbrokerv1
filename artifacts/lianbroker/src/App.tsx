import { type MouseEvent, useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import {
  ArrowRight,
  Check,
  ChevronDown,
  Clipboard,
  Copy,
  Info,
  Menu,
  MessageCircle,
  Moon,
  Search,
  ShieldCheck,
  Sun,
  X,
} from 'lucide-react';

type Plan = {
  price: number;
  days: number;
};

type PaymentMethod = 'GoPay' | 'DANA' | 'SeaBank';

const plans: Plan[] = [
  { price: 100000, days: 120 },
  { price: 90000, days: 100 },
  { price: 80000, days: 94 },
  { price: 70000, days: 82 },
  { price: 50000, days: 64 },
  { price: 20000, days: 30 },
  { price: 15000, days: 20 },
  { price: 10000, days: 15 },
  { price: 8000, days: 10 },
  { price: 5000, days: 5 },
  { price: 3000, days: 3 },
  { price: 2000, days: 2 },
  { price: 1000, days: 1 },
];

const paymentDetails: Record<PaymentMethod, string> = {
  GoPay: '083140177531',
  DANA: '083140177531',
  SeaBank: '901093461429',
};

const faqs = [
  {
    question: 'Apa yang saya dapat setelah pembayaran?',
    answer:
      'Operator akan memproses aktivasi bot sesuai durasi yang dipilih. Simpan bukti transfer lalu kirimkan ke WhatsApp LianBroker agar pesanan dapat dicek dan dijalankan.',
  },
  {
    question: 'Berapa lama proses aktivasinya?',
    answer:
      'Biasanya cepat setelah bukti pembayaran diterima. Untuk menjaga akurasi, operator akan mengonfirmasi pesanan dan detail aktivasi melalui WhatsApp.',
  },
  {
    question: 'Apakah bisa memperpanjang durasi?',
    answer:
      'Bisa. Pilih paket baru kapan saja sebelum atau setelah masa aktif berakhir, lalu informasikan kepada operator agar riwayat pesanan Anda bisa dicocokkan.',
  },
  {
    question: 'QR di halaman pembayaran ini untuk apa?',
    answer:
      'QR ini adalah QR informasi yang dibuat dari metode, akun pembayaran, dan paket pilihan Anda. Ini bukan QRIS merchant terverifikasi. Gunakan detail akun yang tampil dan tetap kirim bukti pembayaran lewat WhatsApp.',
  },
  {
    question: 'Bagaimana jika saya salah memilih paket?',
    answer:
      'Jangan lanjutkan pembayaran. Tutup modal, pilih paket yang benar, lalu buat ringkasan baru. Jika sudah terlanjur transfer, segera hubungi operator dengan bukti pembayaran.',
  },
];

function formatIDR(value: number) {
  return `Rp${value.toLocaleString('id-ID')}`;
}

function whatsappFor(plan?: Plan) {
  const planText = plan ? ` paket ${formatIDR(plan.price)} / ${plan.days} hari` : '';
  const message = `Halo LianBroker, saya ingin menyewa bot WhatsApp${planText}. Mohon bantu prosesnya.`;
  return `https://wa.me/6287842296791?text=${encodeURIComponent(message)}`;
}

function App() {
  const [isDark, setIsDark] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('GoPay');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [toast, setToast] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');

  useEffect(() => {
    const savedTheme = window.localStorage.getItem('lianbroker-theme');
    setIsDark(savedTheme === 'dark');
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    window.localStorage.setItem('lianbroker-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  useEffect(() => {
    if (!selectedPlan) return undefined;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedPlan(null);
    };
    document.addEventListener('keydown', closeOnEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      document.body.style.overflow = '';
    };
  }, [selectedPlan]);

  const filteredPlans = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return plans;
    return plans.filter(
      (plan) =>
        formatIDR(plan.price).toLowerCase().includes(query) ||
        String(plan.price).includes(query) ||
        String(plan.days).includes(query),
    );
  }, [search]);

  const qrPayload = useMemo(() => {
    if (!selectedPlan) return '';
    return [
      'LIANBROKER',
      `METODE: ${paymentMethod}`,
      `PEMBAYARAN: ${paymentDetails[paymentMethod]}`,
      `PAKET: ${formatIDR(selectedPlan.price)}`,
      `DURASI: ${selectedPlan.days} HARI`,
      'KONFIRMASI: WHATSAPP +6287842296791',
    ].join('\n');
  }, [paymentMethod, selectedPlan]);

  useEffect(() => {
    if (!qrPayload) {
      setQrDataUrl('');
      return;
    }

    let cancelled = false;
    QRCode.toDataURL(qrPayload, {
      width: 260,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: { dark: '#10213b', light: '#ffffff' },
    })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl('');
      });

    return () => {
      cancelled = true;
    };
  }, [qrPayload]);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2400);
  };

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const temporaryInput = document.createElement('textarea');
      temporaryInput.value = text;
      document.body.appendChild(temporaryInput);
      temporaryInput.select();
      document.execCommand('copy');
      temporaryInput.remove();
    }
    showToast(`${label} berhasil disalin`);
  };

  const goTo = (event: MouseEvent<HTMLAnchorElement>) => {
    setIsMenuOpen(false);
    const target = event.currentTarget.getAttribute('href');
    if (target?.startsWith('#')) {
      window.setTimeout(() => document.querySelector(target)?.scrollIntoView({ behavior: 'smooth' }), 0);
    }
  };

  return (
    <div className="lb-app">
      <header className="lb-header">
        <div className="container-lb nav-inner">
          <a href="#beranda" className="brand" onClick={goTo} data-testid="link-brand">
            <span className="brand-mark">LB</span>
            <span className="brand-name">lian<i>broker</i></span>
          </a>
          <nav className="desktop-nav" aria-label="Navigasi utama">
            <a href="#paket" className="nav-link" onClick={goTo} data-testid="link-paket">Paket</a>
            <a href="#fitur" className="nav-link" onClick={goTo} data-testid="link-fitur">Fitur</a>
            <a href="#faq" className="nav-link" onClick={goTo} data-testid="link-faq">FAQ</a>
            <a href="#bantuan" className="nav-link" onClick={goTo} data-testid="link-bantuan">Bantuan</a>
          </nav>
          <div className="nav-actions">
            <button
              type="button"
              className="icon-btn"
              aria-label={isDark ? 'Pakai tema terang' : 'Pakai tema gelap'}
              onClick={() => setIsDark((current) => !current)}
              data-testid="button-theme-toggle"
            >
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <button
              type="button"
              className="menu-btn"
              aria-label="Buka menu"
              aria-expanded={isMenuOpen}
              onClick={() => setIsMenuOpen((current) => !current)}
              data-testid="button-mobile-menu"
            >
              {isMenuOpen ? <X size={17} /> : <Menu size={17} />}
            </button>
          </div>
        </div>
        <nav className={`container-lb mobile-menu ${isMenuOpen ? 'open' : ''}`} aria-label="Navigasi mobile">
          <a href="#paket" className="nav-link" onClick={goTo} data-testid="mobile-link-paket">Paket sewa</a>
          <a href="#fitur" className="nav-link" onClick={goTo} data-testid="mobile-link-fitur">Fitur layanan</a>
          <a href="#faq" className="nav-link" onClick={goTo} data-testid="mobile-link-faq">Pertanyaan umum</a>
          <a href="#bantuan" className="nav-link" onClick={goTo} data-testid="mobile-link-bantuan">Hubungi operator</a>
        </nav>
      </header>

      <main>
        <section id="beranda" className="hero">
          <div className="container-lb hero-grid">
            <div className="hero-copy">
              <div className="eyebrow">[ lianbroker / channel rental ]</div>
              <h1 className="hero-title">Bot siap kerja.<br /><em>Durasi jelas.</em><br />Operator nyata.</h1>
              <p className="hero-lede">
                Sewa bot WhatsApp tanpa alur yang berbelit. Pilih masa aktif sesuai kebutuhan,
                bayar dengan metode lokal, lalu serahkan sisanya ke operator LianBroker.
              </p>
              <div className="hero-actions">
                <a href="#paket" className="btn" onClick={goTo} data-testid="link-hero-paket">
                  Lihat paket <ArrowRight size={15} />
                </a>
                <a href={whatsappFor()} target="_blank" rel="noreferrer" className="btn secondary" data-testid="link-hero-whatsapp">
                  <MessageCircle size={15} /> Tanya operator
                </a>
              </div>
              <div className="hero-meta">
                <span className="status-dot" />
                <span>OPERATOR ONLINE</span>
                <span aria-hidden="true">/</span>
                <span>RESPON CEPAT VIA WHATSAPP</span>
              </div>
            </div>
            <div className="terminal-card" aria-label="Status LianBroker">
              <div className="terminal-top">
                <span>lianbroker://status</span>
                <span className="terminal-dots"><i /><i /><i /></span>
              </div>
              <div className="terminal-body">
                <div className="terminal-line"><b>&gt;</b><span>memuat katalog paket...</span></div>
                <div className="terminal-line"><b>&gt;</b><span>memeriksa jalur pembayaran...</span></div>
                <div className="terminal-output">
                  <strong>SIAP MENERIMA PESANAN</strong>
                  <span>13 paket aktif / 3 metode pembayaran</span>
                </div>
                <div className="terminal-line"><b>+</b><span>durasi tampil di muka, tanpa tebakan</span></div>
                <div className="terminal-footer"><span>node: id-jkt-01</span><span><span className="status-dot" /> live</span></div>
              </div>
            </div>
          </div>
        </section>

        <div className="ticker">
          <div className="container-lb ticker-inner">
            <div className="ticker-track"><span>PAKET 1 HARI — 120 HARI</span><span>GOPAY / DANA / SEABANK</span><span>KONFIRMASI MANUAL</span></div>
            <div className="ticker-live"><span className="status-dot" /> jalur operator aktif</div>
          </div>
        </div>

        <section className="section" aria-label="Ringkasan layanan">
          <div className="container-lb">
            <div className="section-head">
              <div><div className="eyebrow">/ snapshot</div><h2 className="section-title">Satu layar untuk mulai jalan.</h2></div>
              <p className="section-note">Informasi yang perlu Anda tahu ada di depan. Tidak ada harga yang disamarkan di balik tombol.</p>
            </div>
            <div className="stats-grid">
              <div className="stat"><span className="stat-value">13</span><span className="stat-label">paket durasi aktif</span></div>
              <div className="stat"><span className="stat-value">01—120</span><span className="stat-label">rentang hari sewa</span></div>
              <div className="stat"><span className="stat-value">03</span><span className="stat-label">jalur pembayaran</span></div>
              <div className="stat"><span className="stat-value">REAL</span><span className="stat-label">operator di WhatsApp</span></div>
            </div>
          </div>
        </section>

        <section id="paket" className="section package-section">
          <div className="container-lb">
            <div className="section-head">
              <div><div className="eyebrow">/ katalog paket</div><h2 className="section-title">Pilih durasi, lanjutkan.</h2></div>
              <p className="section-note">Mulai dari Rp1.000. Semua paket ditampilkan apa adanya agar keputusan Anda tetap sederhana.</p>
            </div>
            <div className="package-toolbar">
              <div className="search-wrap">
                <Search size={15} />
                <input
                  type="search"
                  className="search-input"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Cari harga atau durasi..."
                  aria-label="Cari paket berdasarkan harga atau durasi"
                  data-testid="input-search-package"
                />
              </div>
              <span className="result-count" data-testid="text-package-count">{filteredPlans.length} paket ditemukan</span>
            </div>
            <div className="package-grid">
              {filteredPlans.length > 0 ? filteredPlans.map((plan, index) => {
                const isPopular = plan.price === 100000;
                return (
                  <article key={plan.price} className={`package-card ${isPopular ? 'popular' : ''}`} data-testid={`card-package-${plan.price}`}>
                    {isPopular && <span className="popular-label">NILAI TERBAIK</span>}
                    <span className="package-index">paket / {String(index + 1).padStart(2, '0')}</span>
                    <div className="package-price" data-testid={`text-price-${plan.price}`}>{formatIDR(plan.price)}</div>
                    <div className="package-days" data-testid={`text-duration-${plan.price}`}>{plan.days} hari aktif</div>
                    <div className="package-caption">{isPopular ? 'Untuk pemakaian panjang tanpa sering isi ulang.' : 'Masa aktif langsung terlihat.'}</div>
                    <button type="button" className="btn" onClick={() => { setSelectedPlan(plan); setPaymentMethod('GoPay'); }} data-testid={`button-choose-${plan.price}`}>
                      Pilih paket <ArrowRight size={14} />
                    </button>
                  </article>
                );
              }) : <div className="empty-results" data-testid="empty-package-results">Tidak ada paket yang cocok. Coba cari angka harga atau jumlah hari lain.</div>}
            </div>
          </div>
        </section>

        <section id="fitur" className="section">
          <div className="container-lb feature-layout">
            <div>
              <div className="eyebrow">/ cara kerja kami</div>
              <h2 className="section-title">Ringkas di layar.<br />Serius di belakang.</h2>
            </div>
            <div className="feature-list">
              <div className="feature-item"><span className="feature-num">01</span><div><h3>Durasi tidak bikin menebak</h3><p>Setiap kartu paket menyebutkan harga dan masa aktifnya dengan jelas. Pilih berdasarkan ritme kerja, bukan asumsi.</p></div></div>
              <div className="feature-item"><span className="feature-num">02</span><div><h3>Bayar dengan jalur yang dikenal</h3><p>GoPay, DANA, dan SeaBank tersedia di alur pembayaran. Detail akun bisa disalin, lalu bukti dikirim ke operator.</p></div></div>
              <div className="feature-item"><span className="feature-num">03</span><div><h3>Ada orang di ujung proses</h3><p>LianBroker bukan kotak hitam otomatis. WhatsApp operator selalu siap untuk konfirmasi dan pertanyaan pesanan.</p></div></div>
            </div>
            <aside className="feature-aside">
              <span className="quote-mark">“</span>
              <p>Kalau bot harus bekerja terus, proses sewanya tidak boleh ikut bikin lelah.</p>
              <small>— prinsip kerja lianbroker / 2024</small>
            </aside>
          </div>
        </section>

        <section className="section">
          <div className="container-lb">
            <div className="section-head">
              <div><div className="eyebrow">/ alur pesanan</div><h2 className="section-title">Dari pilih sampai aktif.</h2></div>
              <p className="section-note">Tiga langkah yang bisa diselesaikan dari ponsel, tanpa akun baru.</p>
            </div>
            <div className="steps">
              <div className="step"><span className="step-num">01</span><h3>Tentukan paket</h3><p>Bandingkan harga dan hari aktif, lalu tekan Pilih paket pada kartu yang sesuai.</p></div>
              <div className="step"><span className="step-num">02</span><h3>Selesaikan pembayaran</h3><p>Pilih metode lokal, salin detail akun, dan gunakan QR informasi sebagai pengingat transaksi.</p></div>
              <div className="step"><span className="step-num">03</span><h3>Kirim bukti ke operator</h3><p>Tekan tombol WhatsApp. Sertakan bukti pembayaran agar aktivasi bisa segera diproses.</p></div>
            </div>
          </div>
        </section>

        <section id="faq" className="section">
          <div className="container-lb">
            <div className="section-head">
              <div><div className="eyebrow">/ faq.log</div><h2 className="section-title">Pertanyaan sebelum mulai.</h2></div>
              <p className="section-note">Masih ada yang belum jelas? Operator kami bisa membantu di bagian bawah halaman.</p>
            </div>
            <div className="faq-list">
              {faqs.map((faq, index) => {
                const isOpen = openFaq === index;
                return (
                  <div className="faq-item" key={faq.question}>
                    <button type="button" className="faq-question" onClick={() => setOpenFaq(isOpen ? null : index)} aria-expanded={isOpen} data-testid={`button-faq-${index}`}>
                      <span>{faq.question}</span><ChevronDown size={18} className={`faq-icon ${isOpen ? 'open' : ''}`} />
                    </button>
                    {isOpen && <div className="faq-answer" data-testid={`text-faq-answer-${index}`}>{faq.answer}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section id="bantuan" className="section">
          <div className="container-lb">
            <div className="help-panel">
              <div>
                <div className="eyebrow">/ direct line</div>
                <h2>Butuh arahan sebelum checkout?</h2>
                <p>Sampaikan kebutuhan Anda apa adanya. Operator LianBroker akan membantu memilihkan durasi dan memandu konfirmasi pembayaran.</p>
              </div>
              <div className="help-contact">
                <div className="number">+62 878-4229-6791</div>
                <a href={whatsappFor()} target="_blank" rel="noreferrer" className="btn" data-testid="link-help-whatsapp"><MessageCircle size={15} /> Buka WhatsApp</a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container-lb footer-inner">
          <div>
            <a href="#beranda" className="brand" onClick={goTo} data-testid="link-footer-brand"><span className="brand-mark">LB</span><span className="brand-name">lian<i>broker</i></span></a>
            <p>Rental bot WhatsApp yang jelas, cepat, dan bisa ditanya.</p>
          </div>
          <div className="footer-meta">operated from Indonesia<br />status: <span className="status-dot" /> online</div>
        </div>
      </footer>

      {selectedPlan && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedPlan(null); }}>
          <div className="payment-modal" role="dialog" aria-modal="true" aria-labelledby="payment-title" data-testid="modal-payment">
            <div className="modal-head">
              <h2 id="payment-title">Konfirmasi paket</h2>
              <button type="button" className="close-btn" onClick={() => setSelectedPlan(null)} aria-label="Tutup pembayaran" data-testid="button-close-payment"><X size={17} /></button>
            </div>
            <div className="modal-content">
              <div className="order-summary">
                <span className="summary-label">order summary</span>
                <div className="summary-plan">{formatIDR(selectedPlan.price)}</div>
                <div className="summary-row"><span>masa aktif</span><strong>{selectedPlan.days} hari</strong></div>
                <div className="summary-row"><span>status</span><strong>siap diproses</strong></div>
                <button type="button" className="copy-button" onClick={() => copyText(`${formatIDR(selectedPlan.price)} / ${selectedPlan.days} hari`, 'Ringkasan pesanan')} data-testid="button-copy-summary"><Copy size={13} /> salin ringkasan</button>
                <div className="modal-note"><ShieldCheck size={15} /><span>Aktivasi diproses setelah bukti pembayaran diterima operator.</span></div>
              </div>
              <div>
                <span className="method-label">01 / pilih metode pembayaran</span>
                <div className="method-options">
                  {(['GoPay', 'DANA', 'SeaBank'] as PaymentMethod[]).map((method) => (
                    <button type="button" key={method} className={`method-option ${paymentMethod === method ? 'active' : ''}`} onClick={() => setPaymentMethod(method)} data-testid={`button-method-${method.toLowerCase()}`}>{method}</button>
                  ))}
                </div>
                <span className="method-label">02 / detail pembayaran</span>
                <div className="account-box">
                  <strong data-testid="text-payment-account">{paymentDetails[paymentMethod]}</strong>
                  <button type="button" className="copy-button" onClick={() => copyText(paymentDetails[paymentMethod], 'Detail pembayaran')} data-testid="button-copy-account"><Clipboard size={13} /> salin</button>
                </div>
                <div className="qr-wrap">
                  <div className="qr-grid" aria-label="QR informasi pembayaran" data-testid="qr-information">
                    {qrDataUrl ? <img src={qrDataUrl} alt={`QR informasi ${paymentMethod} untuk paket ${formatIDR(selectedPlan.price)}`} /> : <span className="qr-loading">memuat QR...</span>}
                  </div>
                  <div className="qr-copy"><h4>QR INFORMASI</h4><p>Dibuat untuk {paymentMethod} dan paket {formatIDR(selectedPlan.price)}. Ini bukan QRIS merchant terverifikasi.</p></div>
                </div>
                <div className="modal-note"><Info size={15} /><span>Setelah transfer, kirim bukti pembayaran lewat WhatsApp agar pesanan bisa dikonfirmasi.</span></div>
                <div className="modal-actions">
                  <a href={whatsappFor(selectedPlan)} target="_blank" rel="noreferrer" className="btn" data-testid="link-modal-whatsapp"><MessageCircle size={15} /> Kirim bukti</a>
                  <button type="button" className="btn secondary" onClick={() => setSelectedPlan(null)} data-testid="button-finish-payment">Selesai</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast" role="status" data-testid="status-copy-feedback"><Check size={14} /> {toast}</div>}
    </div>
  );
}

export default App;
import styles from "./page.module.css";

const FEATURES = [
  {
    title: "Dois jeitos de enviar",
    description:
      "Conecte a Cloud API oficial da Meta ou sua instância Evolution API — a mesma campanha funciona nos dois, sem trocar de ferramenta.",
  },
  {
    title: "Segmentação por tag",
    description:
      "Filtre sua base por tag e veja o tamanho real da audiência antes de agendar — sem surpresa na hora do disparo.",
  },
  {
    title: "Fila com retentativa automática",
    description:
      "Backoff exponencial em caso de falha e status detalhado por campanha: enviada, entregue, lida ou falhou.",
  },
  {
    title: "Opt-out automático",
    description:
      'Quem responde "sair" ou "parar" é removido da lista na hora, com confirmação — sem precisar de um operador.',
  },
  {
    title: "Inbox de respostas",
    description: "Veja o histórico de cada conversa recebida pelos canais bidirecionais, direto no painel.",
  },
  {
    title: "Importação por CSV",
    description: "Suba sua base inteira de uma vez — nome, telefone e tags numa planilha simples.",
  },
];

const STEPS = [
  {
    title: "Conecte um canal",
    description: "WhatsApp Cloud API ou Evolution API — a credencial fica guardada com segurança, nunca exposta.",
  },
  {
    title: "Importe ou cadastre contatos",
    description: "Um por um ou via CSV, já com tags pra segmentar depois.",
  },
  {
    title: "Crie um template e agende",
    description: "Escolha o segmento, a data e o horário do disparo.",
  },
  {
    title: "Acompanhe em tempo real",
    description: "Enviadas, entregues, lidas e falhas — sem sair do painel.",
  },
];

const ROADMAP = [
  { label: "WhatsApp", live: true },
  { label: "Telegram", live: false },
  { label: "SMS", live: false },
  { label: "E-mail", live: false },
  { label: "Instagram", live: false },
  { label: "Facebook", live: false },
  { label: "Wi-Fi", live: false },
  { label: "Bluetooth", live: false },
];

export default function HomePage() {
  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <span className={styles.logo}>Campanhas Mkt</span>
          <a className={styles.navCta} href="/login">
            Entrar
          </a>
        </div>
      </nav>

      <header className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.eyebrow}>Fox Tecnologia · Campanhas multicanal</div>
          <h1 className={styles.heroTitle}>Uma central de campanhas que fala a língua do seu cliente</h1>
          <p className={styles.heroSubtitle}>
            Comece pelo WhatsApp: conecte um número oficial ou sua instância Evolution API, segmente sua base e
            acompanhe cada envio em tempo real — com opt-out automático e fila com retentativa embutidos.
          </p>
          <div className={styles.heroActions}>
            <a className={styles.ctaPrimary} href="/login">
              Entrar no painel
            </a>
            <a className={styles.ctaSecondary} href="#como-funciona">
              Ver como funciona
            </a>
          </div>
        </div>
      </header>

      <section className={styles.section}>
        <div className={styles.wrap}>
          <div className={styles.kicker}>O que já funciona</div>
          <h2 className={styles.sectionTitle}>Construído pra WhatsApp de verdade, não um MVP de vitrine</h2>
          <div className={styles.features}>
            {FEATURES.map((f) => (
              <div className={styles.feature} key={f.title}>
                <h3>{f.title}</h3>
                <p>{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section} id="como-funciona">
        <div className={styles.wrap}>
          <div className={styles.kicker}>Como funciona</div>
          <h2 className={styles.sectionTitle}>Da conexão do canal ao relatório de entrega</h2>
          <div className={styles.steps}>
            {STEPS.map((s, i) => (
              <div className={styles.step} key={s.title}>
                <div className={styles.stepNumber}>{i + 1}</div>
                <div>
                  <h3>{s.title}</h3>
                  <p>{s.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.wrap}>
          <div className={styles.kicker}>Roadmap</div>
          <h2 className={styles.sectionTitle}>Hoje: WhatsApp. O resto vem por trás da mesma interface de canal.</h2>
          <p className={styles.sectionLede}>
            Cada canal novo entra como uma implementação a mais da mesma peça — o núcleo de campanhas, segmentos e
            relatórios não muda.
          </p>
          <div className={styles.chips}>
            {ROADMAP.map((r) => (
              <span key={r.label} className={r.live ? `${styles.chip} ${styles.chipLive}` : styles.chip}>
                {r.label} {r.live ? "· ativo" : "· em breve"}
              </span>
            ))}
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <span>Fox Tecnologia</span>
        <a href="/login">Entrar no painel →</a>
      </footer>
    </div>
  );
}

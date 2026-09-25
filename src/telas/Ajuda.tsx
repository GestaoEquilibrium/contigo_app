import { useLocation, useNavigate } from 'react-router-dom';
import { FluxoTopo, LinhaAcao, Moldura } from '../componentes/base';
import { Tel, Vento } from '../componentes/icones';

/** Ajuda agora: a um toque de qualquer tela. Telefones discam ao tocar. */
export function Ajuda() {
  const nav = useNavigate();
  const loc = useLocation();
  const de = ((loc.state ?? {}) as { de?: string }).de ?? '/';
  return (
    <Moldura>
      <div className="entra">
        <FluxoTopo aoVoltar={() => nav(de)} />
        <h1>Você não precisa passar por isso sozinho(a).</h1>
        <p className="lead">Toque para ligar. É de graça e alguém atende.</p>
        <LinhaAcao icone={<Tel />} classe="forte" titulo="Ligar 188 — CVV" sub="Alguém para ouvir você. 24 horas, todos os dias." href="tel:188" />
        <LinhaAcao icone={<Tel />} classe="urgente" titulo="Ligar 192 — SAMU" sub="Se houver risco de vida agora." href="tel:192" />
        <LinhaAcao icone={<Vento />} titulo="Respirar comigo por 1 minuto" sub="Enquanto decide o próximo passo."
          onClick={() => nav('/pratica', { state: { segundos: 60, titulo: 'Respirar comigo', de: '/ajuda' } })} />
        <p className="nota">Se estiver em perigo agora, ligue 192 ou vá ao pronto-socorro mais perto. O CVV também atende por chat em <a href="https://www.cvv.com.br" target="_blank" rel="noopener noreferrer">cvv.com.br</a>.</p>
      </div>
    </Moldura>
  );
}

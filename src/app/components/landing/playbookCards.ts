import img1 from "@/imports/Frame40/60cad66f4cfa5f52f9641c69485dc5b5d2ab3240.png";
import img2 from "@/imports/Frame40/d2c334a4076b6c487e3ea80cb85badc3a62d382a.png";
import img3 from "@/imports/Frame40/e8d1c22783558451af67905f3882e892672bcedd.png";
import img4 from "@/imports/Frame40/03c90226a3e276570815cfd0aa2ae634808ea036.png";
import img5 from "@/imports/Frame40/69308978712189e9b71ca29f25fc1b784dd14d4e.png";
import img6 from "@/imports/Frame40/7a3153fe3e650e974d8c5272b45d09226a8df6fb.png";
import img7 from "@/imports/Frame40/32be89d0c318abebb2c6941213cf31165e238297.png";
import img8 from "@/imports/Frame40/00ebbaf6b19e00d2eca4552f8453bf792f6d7804.png";
import img9 from "@/imports/Frame40/7627b3859b78e099fbbe649001a4715539e704eb.png";

export interface PlaybookCard {
  image: string;
  title: string;
  description: string;
}

const BASE: PlaybookCard[] = [
  { image: img1, title: "Priorizar estratégicamente", description: "Decidir qué funcionalidades se abordan de inmediato para maximizar el valor con el menor uso de recursos posible." },
  { image: img2, title: "Formular hipótesis y supuestos", description: "Convertir la incertidumbre y suposición en experimentos medibles, sobre los usuarios, el negocio o la tecnología." },
  { image: img3, title: "Segmentar por etapas", description: "Dividir la visión a largo plazo en entregas incrementales para validar de forma temprana y reducir el desperdicio." },
  { image: img4, title: "Definir principios de diseño", description: "Establecer principios compartidos que guíen la toma de decisiones, eliminando debates subjetivos." },
  { image: img5, title: "Justificación de diseño", description: "Documentar el por qué de las decisiones: lógica, alternativas, pros y contras, fundamento y contexto." },
  { image: img6, title: "Definir objetivos", description: "Alinear al equipo en un objetivo claro, medible y accionable que guíe todas las decisiones posteriores." },
  { image: img7, title: "Definir problema", description: "Diagnosticar el problema correcto identificando qué trabajo intenta resolver el usuario y por qué falla hoy." },
  { image: img8, title: "Mapear restricciones", description: "Identificar y documentar los límites técnicos, legales, de negocio o de tiempo para que las decisiones sean viables." },
  { image: img9, title: "Planificar ruta de diseño", description: "Mapear actividades, entregables y puntos de decisión para alinear esfuerzo, tiempos y desarrollo." },
];

const EXTRA: PlaybookCard[] = [
  { image: img2, title: "Validar con usuarios", description: "Probar conceptos con personas reales antes de invertir tiempo en implementación o producción." },
  { image: img5, title: "Iterar con evidencia", description: "Refinar el diseño con datos cualitativos y cuantitativos en lugar de opiniones aisladas." },
  { image: img1, title: "Reducir alcance", description: "Recortar lo accesorio para concentrar el esfuerzo en lo que cambia la experiencia de verdad." },
  { image: img8, title: "Diseñar para el borde", description: "Anticipar errores, estados vacíos y casos extremos como parte del flujo principal." },
  { image: img3, title: "Sistema sobre pieza", description: "Construir patrones reutilizables que escalen mejor que soluciones únicas por pantalla." },
  { image: img7, title: "Medir lo que importa", description: "Definir métricas accionables que reflejen el comportamiento real del usuario, no vanidad." },
  { image: img4, title: "Documentar decisiones", description: "Dejar trazabilidad del porqué para que futuras iteraciones partan de contexto, no de cero." },
  { image: img9, title: "Alinear con negocio", description: "Conectar cada decisión de diseño con el objetivo de producto que la justifica." },
  { image: img6, title: "Diseñar accesible", description: "Tratar la accesibilidad como requisito base, no como ajuste posterior al lanzamiento." },
  { image: img2, title: "Probar antes de pulir", description: "Validar la estructura antes de invertir en visuales finos: forma antes que estilo." },
  { image: img5, title: "Cerrar el loop", description: "Llevar los aprendizajes de cada release de vuelta al backlog como evidencia accionable." },
];

export const PLAYBOOK_CARDS: PlaybookCard[] = [...BASE, ...EXTRA];

import { QuizQuestion } from '../types';

export interface SampleQuizPreset {
  id: string;
  setName: string;
  subjectName: string;
  description: string;
  questions: QuizQuestion[];
}

export const SAMPLE_QUIZ_PRESETS: SampleQuizPreset[] = [
  {
    id: 'preset_marx',
    setName: '考研政治·马原与认识论核心精选卷',
    subjectName: '政治',
    description: '涵盖认识论、唯物辩证法矛盾规律等经典考点与高频陷阱题',
    questions: [
      {
        id: 'q_marx_1',
        questionNumber: '1',
        type: 'single_choice',
        stem: '毛泽东在《矛盾论》中指出：“主要矛盾和非主要矛盾、矛盾的主要方面和非主要方面的界限不能忽视。”唯物辩证法认为，事物的性质主要是由（ ）。',
        options: [
          { key: 'A', text: '主要矛盾决定的' },
          { key: 'B', text: '主要矛盾的主要方面决定的' },
          { key: 'C', text: '矛盾的普遍性决定的' },
          { key: 'D', text: '矛盾双方的同一性决定的' },
        ],
        answer: 'B',
        explanation: '【核心考点】唯物辩证法对立统一规律。\n【正确项逻辑】事物的性质主要是由主要矛盾的主要方面决定的。矛盾的主要方面在事物内部居于支配地位、起着主导作用。\n【易错陷阱】A选项混淆了“主要矛盾”与“矛盾的主要方面”：主要矛盾决定事物的发展进程和方向，而矛盾的主要方面才决定事物的性质！\n【秒杀口诀】“主矛定进程，主方定性质”。',
        knowledgePoint: '对立统一规律与矛盾的主要方面',
        difficulty: 'medium',
      },
      {
        id: 'q_marx_2',
        questionNumber: '2',
        type: 'multiple_choice',
        stem: '在真理标准问题上，实践之所以能够作为检验真理的唯一标准，是因为实践具有（ ）。',
        options: [
          { key: 'A', text: '客观实在性' },
          { key: 'B', text: '自觉能动性' },
          { key: 'C', text: '直接现实性' },
          { key: 'D', text: '普遍性' },
        ],
        answer: 'CD',
        explanation: '【核心考点】实践是检验真理的唯一标准。\n【正确项逻辑】实践之所以能够成为检验真理的唯一标准，是由真理的本性和实践的特点决定的。实践具有“直接现实性”和“普遍性”的特点。直接现实性使实践能把主观认识同客观实际联系并加以对照；普遍性表明实践包含着普遍性的品格。\n【易错陷阱】AB属于实践的一般特征，但不是实践作为“检验真理标准”的特有依据！',
        knowledgePoint: '实践是检验真理的唯一标准',
        difficulty: 'hard',
      },
      {
        id: 'q_marx_3',
        questionNumber: '3',
        type: 'single_choice',
        stem: '“凡事预则立，不预则废。”从哲学认识论的角度看，这强调了（ ）。',
        options: [
          { key: 'A', text: '认识对实践具有超前性和指导作用' },
          { key: 'B', text: '实践是认识的唯一来源' },
          { key: 'C', text: '人的主观能动性决定客观规律' },
          { key: 'D', text: '认识可以脱离实践而独立存在' },
        ],
        answer: 'A',
        explanation: '【核心考点】认识与实践的辩证关系。\n【正确项逻辑】“预”代表预见、计划与科学认识。正确的认识对实践具有能动的反作用，科学的预见可以超前指导实践走向成功。\n【易错陷阱】C项主观唯心主义（规律是客观的，不能被决定）；D项认识不能脱离实践。',
        knowledgePoint: '认识对实践的能动反作用',
        difficulty: 'easy',
      },
      {
        id: 'q_marx_4',
        questionNumber: '4',
        type: 'true_false',
        stem: '感性认识是认识的初级阶段，理性认识是对事物本质的把握，因此理性认识必定完全正确，感性认识必定不可靠。',
        options: [
          { key: '正确', text: '正确' },
          { key: '错误', text: '错误' },
        ],
        answer: '错误',
        explanation: '【核心考点】感性认识与理性认识的辩证统一。\n【解析】感性认识和理性认识都有正确和错误之分。理性认识若脱离实际或逻辑推导错误也会产生谬误；感性认识在如实反映事物外部现象时是完全真实的。',
        knowledgePoint: '感性认识与理性认识的关系',
        difficulty: 'medium',
      },
    ],
  },
  {
    id: 'preset_law',
    setName: '法考/刑法法理高频重点强化卷',
    subjectName: '专业课',
    description: '正当防卫与紧急避险辨析、故意与过失经典案例考题',
    questions: [
      {
        id: 'q_law_1',
        questionNumber: '1',
        type: 'single_choice',
        stem: '甲遭遇乙持刀抢劫，在搏斗中甲夺下乙的匕首，乙见状转身逃跑。甲追赶20米后从背后将乙刺成重伤。甲的行为属于（ ）。',
        options: [
          { key: 'A', text: '特殊防卫' },
          { key: 'B', text: '正当防卫' },
          { key: 'C', text: '防卫过当' },
          { key: 'D', text: '故意伤害（防卫不适时）' },
        ],
        answer: 'D',
        explanation: '【核心考点】正当防卫的时间条件（不法侵害必须正在进行）。\n【正确项逻辑】乙见凶器被夺转身逃跑，不法侵害已经结束，防卫条件消失。甲在侵害结束后追击刺伤乙，属于防卫不适时（事前或事后防卫），构成故意伤害罪。\n【易错陷阱】很多考生误选A或C，认为抢劫属于行凶可以无限防卫，但无过当防卫（特殊防卫）的前提仍然是“不法侵害正在进行”！逃跑时危险已消除。',
        knowledgePoint: '正当防卫的时间条件与事后防卫',
        difficulty: 'hard',
      },
      {
        id: 'q_law_2',
        questionNumber: '2',
        type: 'multiple_choice',
        stem: '关于紧急避险与正当防卫的区别，下列说法正确的有（ ）。',
        options: [
          { key: 'A', text: '正当防卫针对的是不法侵害人本人，紧急避险损害的是无辜第三者的合法权益' },
          { key: 'B', text: '紧急避险必须出于“迫不得已”，正当防卫没有“迫不得已”的限制' },
          { key: 'C', text: '紧急避险引起的损害不能超过所避免的损害，且一般应小于所避免的损害' },
          { key: 'D', text: '对职务、业务上负有特定责任的人，不适用紧急避险' },
        ],
        answer: 'ABCD',
        explanation: '【核心考点】正当防卫与紧急避险的构成要件差异。\n【解析】ABCD全选。\nA项：侵害对象不同；\nB项：正当防卫可以躲避也可以反击，但紧急避险必须无其他选择（迫不得已）；\nC项：限度条件不同，正当防卫不能明显超过必要限度造成重大损害，而紧急避险所保护利益必须大于所损害利益；\nD项：消防员、军人等负有特定救险义务人员不适用紧急避险。',
        knowledgePoint: '正当防卫与紧急避险的对比',
        difficulty: 'medium',
      },
    ],
  },
];

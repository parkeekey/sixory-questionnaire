export type Identity = "Feeler" | "Seeker" | "Thinker" | "Keeper";
export type EmotionState = "Clear" | "Intense" | "Quiet";

export interface Choice {
  label: string;
  identity?: Identity;
  state?: EmotionState;
}

export interface Question {
  id: string;
  text: string;
  choices: Record<string, Choice>;
}

export interface QuestionnaireSpec {
  questionnaire: {
    sectionA_archetype: {
      description: string;
      questions: Question[];
    };
    sectionB_emotion: {
      description: string;
      questions: Question[];
    };
  };
  mapping: {
    identity_state_to_asset: Record<Identity, Record<EmotionState, string>>;
  };
  logic: {
    step1: string;
    step2: string;
    step3: string;
  };
}

export const questionnaireSpec: QuestionnaireSpec = {
  questionnaire: {
    sectionA_archetype: {
      description: "Determine core identity",
      questions: [
        {
          id: "Q1",
          text: "คุณเลือกสิ่งไหนมากกว่า?",
          choices: {
            A: { label: "ความรู้สึก", identity: "Feeler" },
            B: { label: "ประสบการณ์ใหม่", identity: "Seeker" },
            C: { label: "ความเข้าใจ", identity: "Thinker" },
            D: { label: "ความมั่นคง", identity: "Keeper" }
          }
        },
        {
          id: "Q2",
          text: "เวลาว่าง คุณมักจะ…",
          choices: {
            A: { label: "ฟังเพลง / อยู่กับอารมณ์", identity: "Feeler" },
            B: { label: "ออกไปข้างนอก", identity: "Seeker" },
            C: { label: "คิด / อ่าน / วิเคราะห์", identity: "Thinker" },
            D: { label: "พัก / ทำอะไรเรียบง่าย", identity: "Keeper" }
          }
        },
        {
          id: "Q3",
          text: "คุณรับมือกับวันที่แย่ยังไง?",
          choices: {
            A: { label: "รู้สึกมันเต็มที่", identity: "Feeler" },
            B: { label: "ออกไปเปลี่ยนบรรยากาศ", identity: "Seeker" },
            C: { label: "คิดหาความหมาย", identity: "Thinker" },
            D: { label: "อยู่เฉยๆ รอให้ผ่าน", identity: "Keeper" }
          }
        },
        {
          id: "Q4",
          text: "คุณเป็นคนแบบไหนมากที่สุด?",
          choices: {
            A: { label: "ลึกและอ่อนโยน", identity: "Feeler" },
            B: { label: "กล้าและอยากลอง", identity: "Seeker" },
            C: { label: "คิดลึก", identity: "Thinker" },
            D: { label: "นิ่งและมั่นคง", identity: "Keeper" }
          }
        }
      ]
    },
    sectionB_emotion: {
      description: "Determine current emotional state",
      questions: [
        {
          id: "Q5",
          text: "วันนี้คุณรู้สึกใกล้กับอะไรที่สุด?",
          choices: {
            A: { label: "โล่ง / พร้อมเริ่มใหม่", state: "Clear" },
            B: { label: "หนัก / ชัด / มีอารมณ์", state: "Intense" },
            C: { label: "นิ่ง / อยากอยู่เงียบๆ", state: "Quiet" }
          }
        },
        {
          id: "Q6",
          text: "จังหวะชีวิตตอนนี้เป็นแบบไหน?",
          choices: {
            A: { label: "ไหลลื่น", state: "Clear" },
            B: { label: "หนักแน่น", state: "Intense" },
            C: { label: "ช้าลง", state: "Quiet" }
          }
        },
        {
          id: "Q7",
          text: "คุณอยากได้อะไรตอนนี้มากที่สุด?",
          choices: {
            A: { label: "ความชัดเจน", state: "Clear" },
            B: { label: "ความเข้มข้น", state: "Intense" },
            C: { label: "ความสงบ", state: "Quiet" }
          }
        }
      ]
    }
  },
  mapping: {
    identity_state_to_asset: {
      Feeler: {
        Clear: "feeler_softlight",
        Intense: "feeler_drenchedbloom",
        Quiet: "feeler_quietembrance"
      },
      Seeker: {
        Clear: "seeker_frozenpath",
        Intense: "seeker_burningHorz",
        Quiet: "seeker_stormseeker"
      },
      Thinker: {
        Clear: "thinker_quiteillu",
        Intense: "thinker_innerstorm",
        Quiet: "thinker_deepstillness"
      },
      Keeper: {
        Clear: "keeper_solarground",
        Intense: "keeper_innerfire",
        Quiet: "keeper_stedyrain"
      }
    }
  },
  logic: {
    step1: "Count answers in Section A -> highest = identity",
    step2: "Count answers in Section B -> highest = state",
    step3: "Map identity + state -> asset"
  }
};

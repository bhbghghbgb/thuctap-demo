import type { Question } from './type'

export const data : Question[] = [
  {
    groupId: 1,
    question: "Con chuột đang ở vị trí nào?",
    questionImage: "./assets/images/toupeira6.svg",
    answerText: "Dưới đất",
    answerImage: "./assets/images/toupeira6.svg"
  },
  {
    groupId: 2,
    question: "Con chuột đang ở vị trí nào?",
    questionImage: "./assets/images/toupeira3.svg",
    answerText: "Trên mặt đất",
    answerImage: "./assets/images/toupeira3.svg"
  },
  {
    groupId: 3,
    question: "Con chuột đang ở vị trí nào?",
    questionImage: "./assets/images/toupeira2.svg",
    answerText: "Nửa trên nửa dưới",
    answerImage: "./assets/images/toupeira2.svg"
  }
];

export const guidelinePages = [
    {
        text: "Cặp đáp án chính xác",
        image: "./assets/images/guide-1.png"
    },
    {
        text: "Nổi giận",
        image: "./assets/images/guide-2.png"
    },
    {
        text: "Bắt được rồi",
        image: "./assets/images/guide-3.png"
    }
];
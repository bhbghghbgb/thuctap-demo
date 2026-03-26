import type { RoundAnswer } from "../type";

type Props = {
    index: number;
    active: boolean;
    goingDown: boolean;
    data?: RoundAnswer;
    hitState?: "correct" | "wrong";
    onClick: (index: number) => void;
};

export default function Hole({
    index,
    active,
    goingDown,
    data,
    hitState,
    onClick,
}: Props) {
    if (goingDown && hitState) {
        console.log(`${active ? "up" : (goingDown ? "down" : "")} ${hitState || ""}`)
    }
    return (
        <div onClick={() => active && onClick(index)}>
            <div
                className={`moles-hole ${active ? "up" : (goingDown ? "down" : "")} ${hitState}`}
            >
                <div className="mole-bubble">
                    <img src={data?.image} alt="" />
                    <div>{data?.text}</div>
                </div>
            </div>
        </div>
    );
}
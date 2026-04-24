import { useSound } from "react-sounds";

// --- Audio Asset Imports ---
// Placeholders are used here. User should download these specific files.
// import sndCheckCorrect from "../../assets/sounds/ui_check_correct.mp3";
// import sndCheckWrong from "../../assets/sounds/ui_check_wrong.mp3";
// import sndCongrats from "../../assets/sounds/ui_congrats.mp3";
// import sndPlaceFail from "../../assets/sounds/ui_place_fail.mp3";
// import sndPlaceSuccess from "../../assets/sounds/ui_place_success.mp3";
// import sndSelect from "../../assets/sounds/ui_select.mp3";
import sndCheckWrong from "../../assets/sounds/device_disconnect.mp3";
import sndPlaceFail from "../../assets/sounds/item_deselect.mp3";
import sndCongrats from "../../assets/sounds/level_up.mp3";
import sndSelect from "../../assets/sounds/notification.mp3";
import sndCheckCorrect from "../../assets/sounds/success.mp3";
import sndPlaceSuccess from "../../assets/sounds/success_blip.mp3";

/**
 * Custom hook to manage all game sound effects.
 *
 * Recommended Sound Sources:
 * - https://freesound.org
 * - https://mixkit.co/free-sound-effects/ui/
 *
 * Files to download and place in assets/sounds/:
 * 1. ui_select.mp3: A short, clean "click" or "pop" for picking up items.
 * 2. ui_place_success.mp3: A satisfying "snap" or "thud" for placing correctly.
 * 3. ui_place_fail.mp3: A soft "whoosh" or "error" bump for failed placement.
 * 4. ui_check_correct.mp3: A bright "ding" or chime for correct answers.
 * 5. ui_check_wrong.mp3: A dull "buzz" or low thud for incorrect answers.
 * 6. ui_congrats.mp3: A small fanfare or "sparkle" for game completion.
 */
export const useGameSounds = () => {
  const { play: playSelect } = useSound(sndSelect);
  const { play: playPlaceSuccess } = useSound(sndPlaceSuccess);
  const { play: playPlaceFail } = useSound(sndPlaceFail);
  const { play: playCheckCorrect } = useSound(sndCheckCorrect);
  const { play: playCheckWrong } = useSound(sndCheckWrong);
  const { play: playCongrats } = useSound(sndCongrats);

  return {
    playSelect,
    playPlaceSuccess,
    playPlaceFail,
    playCheckCorrect,
    playCheckWrong,
    playCongrats,
  };
};

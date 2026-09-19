import { StreakCheckModal } from "@/components/home/StreakModal";
import { StreakCheckResult } from "@/interfaces/home.type";
import useModalStore from "@/stores/modalStore";

export const checkStreak=(result:StreakCheckResult)=>{
    const {addModal} = useModalStore.getState()
    
        const { streak, habit, retain, shield } = result;
    
        // Login chỉ reconcile trạng thái streak.
        // Không tăng streak ở đây nữa.
    
        const usedShield = shield.previous > shield.current;
        const lostStreak = streak.previous > streak.current;
    
        if (!usedShield && !lostStreak) return;
    
        setTimeout(() => {
          addModal({
            type: "custom",
            render: (
              <StreakCheckModal
                data={{
                  streak: {
                    current: streak.current,
                    max: streak.max,
                    previous: streak.previous,
                  },
                  habit: {
                    currentPercent: habit.currentPercent,
                    previousPercent: habit.previousPercent,
                  },
                  retain: {
                    current: retain.current,
                    previous: retain.previous,
                  },
                  shield: {
                    current: shield.current,
                    previous: shield.previous,
                  },
                }}
              />
            ),
          });
        }, 1000);
}

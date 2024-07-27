import React from "react";

type Props = {
  countdownEnd: Date;
};

const Countdown: React.FC<Props> = ({ countdownEnd }) => {
  const [timeLeft, setTimeLeft] = React.useState<number>(
    countdownEnd.getTime() - Date.now()
  );

  React.useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(countdownEnd.getTime() - Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [countdownEnd]);

  const hours = Math.floor(timeLeft / 1000 / 60 / 60);
  const minutes = Math.floor((timeLeft / 1000 / 60) % 60);
  const seconds = Math.floor((timeLeft / 1000) % 60);

  return (
    <div
      style={{
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {hours.toString().padStart(2, "0")}:{minutes.toString().padStart(2, "0")}:
      {seconds.toString().padStart(2, "0")}
    </div>
  );
};

export default Countdown;

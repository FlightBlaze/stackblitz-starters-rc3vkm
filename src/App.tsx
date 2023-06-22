import * as React from 'react';
import './style.css';

export const range = (n) => {
  const items: number[] = [];
  for (let i = 0; i < n; i++) {
    items.push(i);
  }
  return items;
};

export const padTimeUnit = (value: number) => {
  return value <= 9 ? '0' + value : value;
};

export function lerp(start, end, amt) {
  return (1 - amt) * start + amt * end;
}

export type WorkingHours = {
  id: string;
  startsAt: Date;
  endsAt: Date;
  daysOfWeek: number[];
};

export type Unit = {
  id: string;
  name: string;
};

export type Booking = {
  id: string;
  startsAt: Date;
  endsAt: Date;
  text: string;
  color?: string;
  unitId: string;
};

export type Vec2 = {
  x: number;
  y: number;
};

export type Box = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export const Scheduler = () => {
  const units = [
    {
      id: '0',
      name: 'Стол №1',
    },
    {
      id: '1',
      name: 'Стол №2',
    },
    {
      id: '2',
      name: 'Стол №3',
    },
    {
      id: '3',
      name: 'Стол №4',
    },
    {
      id: '4',
      name: 'Стол №5',
    },
    {
      id: '5',
      name: 'Стол №6',
    },
  ];
  const numUnits = units.length;
  const unitWidth = 140;
  const [bookings, setBookings] = React.useState<Booking[]>([
    {
      id: '0',
      startsAt: new Date(2023, 5, 14, 3, 0),
      endsAt: new Date(2023, 5, 14, 4, 45),
      text: 'Екатерина Ермолова +79502712235',
      unitId: '0',
    },
    {
      id: '1',
      startsAt: new Date(2023, 5, 14, 1, 0),
      endsAt: new Date(2023, 5, 14, 1, 45),
      text: 'Дмитрий Козичев +79516776534',
      color: '#FF8965',
      unitId: '1',
    },
    {
      id: '2',
      startsAt: new Date(2023, 5, 14, 22, 0),
      endsAt: new Date(2023, 5, 14, 23, 0),
      text: 'Дмитрий Козичев +79516776534',
      unitId: '0',
    },
  ]);
  const [workingHours, setWorkingHours] = React.useState<WorkingHours[]>([
    {
      id: '0',
      startsAt: new Date(-3600 * 1000),
      endsAt: new Date(3600 * 1000 * 18.5),
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    },
  ]);
  const [ticks, setTicks] = React.useState(0);
  const [dragBookingId, setDragBookingId] = React.useState<null | string>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [isResizing, setIsResizing] = React.useState(false);
  const [mouseOffset, setMouseOffset] = React.useState<Vec2>({ x: 0, y: 0 });
  const [indexOffset, setIndexOffset] = React.useState(0);
  const [initialDuration, setInitialDuration] = React.useState(0);
  const [intervalId, setIntervalId] = React.useState(-1);
  const [mouseClientPos, setMouseClientPos] = React.useState<Vec2>({
    x: 0,
    y: 0,
  });
  const [mousePagePos, setMousePagePos] = React.useState<Vec2>({
    x: 0,
    y: 0,
  });

  const drag = (pos: Vec2) => {
    const unitI = Math.min(
      numUnits - 1,
      Math.max(
        0,
        Math.floor(
          (pos.x + mouseOffset.x + containerRef.current.scrollLeft - 54) /
            unitWidth
        )
      )
    );
    const unitId = units[unitI].id;
    const index = indexOffset + Math.floor(pos.y / 32 + 0.5);
    const hour = Math.floor(Math.max(0, index / 4));
    const minute = index < 0 ? 0 : (index % 4) * 15;
    const startsAt = new Date(
      minute * 60 * 1000 + hour * 3600 * 1000 + fromDate.getTime()
    );
    // const booking = bookings.filter(
    //   (booking) => booking.id === dragBookingId
    // )[0];
    // const endsAt = new Date(
    //   booking.endsAt.getTime() - booking.startsAt.getTime() + startsAt.getTime()
    // );
    const endsAt = new Date(
      minute * 60 * 1000 +
        hour * 3600 * 1000 +
        fromDate.getTime() +
        initialDuration
    );
    // if (endsAt.getDate() !== startsAt.getDate()) {
    //   return;
    // }
    setBookings(
      bookings.map((booking) => {
        if (booking.id === dragBookingId) {
          return {
            ...booking,
            unitId: unitId,
            startsAt: isResizing ? booking.startsAt : startsAt,
            endsAt: isResizing
              ? endsAt
              : new Date(
                  booking.endsAt.getTime() -
                    booking.startsAt.getTime() +
                    startsAt.getTime()
                ),
          };
        } else {
          return { ...booking };
        }
      })
    );
  };

  const [bbox, setBbox] = React.useState<Box>({ x: 0, y: 0, w: 0, h: 0 });
  const containerRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const rect = containerRef.current.getBoundingClientRect();
    setBbox({ x: rect.x, y: rect.y, w: rect.width, h: rect.height });
  }, [containerRef]);

  const [scrollTarget, setScrollTarget] = React.useState(null);
  React.useEffect(() => {
    if (scrollTarget !== null) {
      containerRef.current.scrollTo(
        containerRef.current.scrollLeft,
        lerp(containerRef.current.scrollTop, scrollTarget, 0.5)
      );
      if (Math.abs(containerRef.current.scrollTop - scrollTarget) < 1) {
        setScrollTarget(null);
      }
    }
    if (isDragging) {
      let newMouseOffset = mouseOffset;
      if (mouseClientPos.y > bbox.y + bbox.h * 0.9) {
        newMouseOffset.y -= 20;
        containerRef.current.scrollBy(0, 20);
      } else if (mouseClientPos.y < bbox.y + bbox.h * 0.1) {
        newMouseOffset.y += 20;
        containerRef.current.scrollBy(0, -20);
      }
      if (mouseClientPos.x < bbox.x + bbox.w * 0.1) {
        newMouseOffset.x += 20;
        containerRef.current.scrollBy(-20, 0);
      } else if (mouseClientPos.x > bbox.y + bbox.w * 0.9) {
        newMouseOffset.x -= 20;
        containerRef.current.scrollBy(20, 0);
      }
      setMouseOffset(newMouseOffset);
      const pos = {
        x: mousePagePos.x - mouseOffset.x,
        y: mousePagePos.y - mouseOffset.y,
      } as Vec2;
      drag(pos);
    }
    setTimeout(() => {
      setTicks(ticks + 1);
    }, 16);
  }, [ticks]);

  const smoothlyScrollBy = (y: number) => {
    setScrollTarget(containerRef.current.scrollTop + y);
  };

  const [fromDate, setFromDate] = React.useState(new Date(2023, 5, 14));
  const [toDate, setToDate] = React.useState(new Date(2023, 5, 16));

  const calcDaysDelta = (fromDate: Date, toDate: Date) =>
    (toDate.getTime() - fromDate.getTime()) / 86400 / 1000;

  const numDays = calcDaysDelta(fromDate, toDate) + 1;

  const dateToIndex = (date: Date) => {
    return (
      date.getHours() * 4 +
      (date.getMinutes() / 60) * 4 +
      Math.floor(calcDaysDelta(fromDate, date)) * 24 * 4
    );
  };

  React.useEffect(() => {
    containerRef.current.scrollTo(0, 32);
  }, [containerRef]);

  const [scrolledDays, setScrolledDays] = React.useState(0);

  const ONE_DAY_MS = 86400 * 1000;

  const scrolledDate = React.useMemo(() => {
    return new Date(fromDate.getTime() + scrolledDays * ONE_DAY_MS);
  }, [scrolledDays, fromDate]);

  const monthNames = [
    'янв',
    'фев',
    'мар',
    'апр',
    'мая',
    'июн',
    'июл',
    'авг',
    'сен',
    'окт',
    'ноя',
    'дек',
  ];

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        userSelect: 'none',
        fontFamily: 'sans-serif',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#efefef',
          position: 'relative',
          overflow: 'scroll',
        }}
        ref={containerRef}
        onPointerMove={(event) => {
          if (isDragging) {
            setMouseClientPos({ x: event.clientX, y: event.clientY });
            setMousePagePos({ x: event.pageX, y: event.pageY });
            const pos = {
              x: event.pageX - mouseOffset.x,
              y: event.pageY - mouseOffset.y,
            } as Vec2;
            drag(pos);
          }
        }}
        onPointerUp={() => {
          setIsDragging(false);
          if (intervalId !== -1) {
            clearInterval(intervalId);
            setIntervalId(-1);
          }
        }}
        onScroll={(event) => {
          if (event.currentTarget.scrollTop < 100) {
            setFromDate(new Date(fromDate.getTime() - 86400 * 1000));
            const scrollBy = 24 * 4 * 32;
            setMouseOffset({ ...mouseOffset, y: mouseOffset.y - scrollBy });
            event.currentTarget.scrollBy(0, scrollBy);
            setScrollTarget(null);
          }
          if (
            event.currentTarget.scrollTop + event.currentTarget.offsetHeight >
            event.currentTarget.scrollHeight - 100
          ) {
            setToDate(new Date(toDate.getTime() + 86400 * 1000));
          }
          setScrolledDays(
            (event.currentTarget.scrollTop + event.currentTarget.offsetHeight) /
              24 /
              4 /
              32
          );
        }}
      >
        <div>
          {[...workingHours].map((workingHours) => {
            const timeToIndex = (time: Date) =>
              time.getHours() * 4 + (time.getMinutes() / 60) * 4;
            const startI = timeToIndex(workingHours.startsAt);
            const durationI = timeToIndex(workingHours.endsAt) - startI;
            return range(numDays).map((i) => (
              <div
                key={workingHours.id + '_' + i}
                style={{
                  height: `${durationI * 32}px`,
                  width: `${numUnits * unitWidth + 54}px`,
                  backgroundColor: 'white',
                  position: 'absolute',
                  top: `${(startI + 1 + 24 * 4 * i) * 32}px`,
                  left: '0',
                  padding: '6px',
                  boxSizing: 'border-box',
                }}
              ></div>
            ));
          })}
        </div>
        <div>
          {range(numUnits + 1).map((n) => {
            return (
              <div
                style={{
                  width: '1.5px',
                  height: `${(24 * 4 * numDays - 1) * 32}px`,
                  backgroundColor: 'rgba(0, 0, 0, 0.1)',
                  position: 'absolute',
                  left: `${n * unitWidth + 54}px`,
                  top: `${32}px`,
                }}
              ></div>
            );
          })}
        </div>
        <div
          style={{
            color: 'rgba(0, 0, 0, 0.6)',
            fontWeight: '400',
            fontSize: '14px',
          }}
        >
          {range(24 * 2 * numDays).map((k) => {
            const n = k % (24 * 2);
            const hour = Math.floor(n / 2);
            const minute = (n % 2) * 30;
            return (
              <div key={k}>
                <div
                  style={{
                    position: 'absolute',
                    top: `${(k + 1) * 32 * 2 - 9 - 32}px`,
                    left: '8px',
                    // fontWeight: `${k % 2 === 0 ? 600 : 400}`,
                  }}
                >
                  {padTimeUnit(hour)}:{padTimeUnit(minute)}
                </div>
                <div
                  style={{
                    height: '1.5px',
                    width: `${numUnits * unitWidth}px`,
                    backgroundColor: 'rgba(0, 0, 0, 0.1)',
                    position: 'absolute',
                    top: `${(k * 2 + 1) * 32}px`,
                    left: '54px',
                  }}
                ></div>
              </div>
            );
          })}
        </div>
        <div
          style={{
            color: 'white',
            fontWeight: '400',
            fontSize: '14px',
          }}
        >
          {[...bookings]
            .sort((a, b) =>
              a.id === dragBookingId && isDragging
                ? 1
                : b.id === dragBookingId && isDragging
                ? -1
                : a.startsAt.getTime() < b.startsAt.getTime()
                ? -1
                : 1
            )
            .map((booking) => {
              const startI = dateToIndex(booking.startsAt);
              const durationI = dateToIndex(booking.endsAt) - startI;
              const unitI = units.indexOf(
                units.filter((unit) => unit.id === booking.unitId)[0]
              );
              return (
                <div
                  key={booking.id}
                  style={{
                    height: `${durationI * 32}px`,
                    width: `${unitWidth - 8}px`,
                    backgroundColor: booking.color ? booking.color : '#20C2F7',
                    position: 'absolute',
                    top: `${(startI + 1) * 32}px`,
                    left: `${54 + unitWidth * unitI}px`,
                    borderRadius: '12px',
                    padding: '6px',
                    boxSizing: 'border-box',
                    boxShadow: '0px 12px 16px rgba(0, 0, 0, 0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                  onPointerDown={(event) => {
                    const rect = event.currentTarget.getBoundingClientRect();
                    const clientY = event.clientY;
                    setInitialDuration(
                      booking.endsAt.getTime() - booking.startsAt.getTime()
                    );
                    setIsResizing(
                      clientY > rect.bottom - 18 && clientY < rect.bottom
                    );
                    setDragBookingId(booking.id);
                    setIsDragging(true);
                    setMouseClientPos({ x: event.clientX, y: event.clientY });
                    setMousePagePos({ x: event.pageX, y: event.pageY });
                    setMouseOffset({ x: event.pageX, y: event.pageY });
                    setIndexOffset(startI);
                    setTimeout(() => {
                      setTicks(ticks + 1);
                    }, 20);
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      flexGrow: '1',
                    }}
                  >
                    {booking.text}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      width: '48px',
                      height: '4px',
                      margin: '3px auto',
                      borderRadius: '12px',
                      backgroundColor: 'white',
                      opacity: '0.5',
                    }}
                  ></div>
                </div>
              );
            })}
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          padding: '6px 12px',
          backgroundColor: 'white',
          bottom: '12px',
          transform: 'translate(-50%)',
          left: '50%',
          borderRadius: '40px',
          boxShadow:
            '0 12px 12px rgba(0, 0, 0, 0.075), 0 0 6px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <i
          className="fa fa-chevron-up"
          onClick={() => {
            smoothlyScrollBy(-24 * 4 * 32);
          }}
        ></i>
        <div
          style={{
            color: 'white',
            backgroundColor: '#ff4f38',
            borderRadius: '100%',
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '500',
          }}
        >
          {scrolledDate.getDate()}
        </div>
        {monthNames[scrolledDate.getMonth()]}
        <i
          className="fa fa-chevron-down"
          onClick={() => {
            smoothlyScrollBy(24 * 4 * 32);
          }}
        ></i>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <div>
      <Scheduler />
    </div>
  );
}

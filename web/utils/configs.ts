import {
  createContext,
  Dispatch,
  MutableRefObject,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { ResinCap } from "../db/resins";
import { setAuthToken } from "./api";
import { MultiMap } from "./multiMap";

type MapLocation = { lat: number; lng: number };

export const MapZoomMin = 4;
export const MapZoomMax = 8;

export type Configs = {
  server: "America" | "Europe" | "Asia" | "TW, HK, MO";
  offsetDays: number;
  resin: {
    value: number;
    time: number;
  };
  resinEstimateMode: "time" | "value";
  characters: string[];
  weapons: string[];
  artifacts: string[];
  itemNotes: { [key: string]: string };
  tasks: Task[];
  taskQuery: string;
  customizeQuery: string;
  iconQuery: string;
  iconListScroll: number;
  mapState: MapLocation & { zoom: number };
  mapTaskDefaultZoom: number;
  mapCreateTask: Task;
  mapFocusedTask: string | false;
  mapTaskList: boolean;
  background: "paimon" | "klee" | "none";
  hiddenWidgets: {
    [key in "clock" | "info" | "sync" | "resin" | "tasks" | "domains"]?: boolean;
  };
  lastChangelog: number;
};

export type Task = {
  id: string;
  icon: string;
  name: string;
  description?: string;
  visible: boolean;
  location: MapLocation;
  dueTime: number;
  refreshTime: number | "reset";
};

const defaultMapCenter = {
  lat: -24.83,
  lng: 54.73,
};

export const DefaultConfigs: Configs = {
  server: "America",
  offsetDays: 0,
  resin: {
    value: ResinCap,
    time: 0,
  },
  resinEstimateMode: "time",
  characters: [],
  weapons: [],
  artifacts: [],
  itemNotes: {},
  tasks: [],
  taskQuery: "",
  customizeQuery: "",
  iconQuery: "",
  iconListScroll: 0,
  mapState: {
    ...defaultMapCenter,
    zoom: 5,
  },
  mapTaskDefaultZoom: 5.6,
  mapCreateTask: {
    id: "temp",
    name: "Iron Chunk",
    icon: "Iron Chunk",
    location: defaultMapCenter,
    dueTime: 0,
    refreshTime: 86400000,
    visible: false,
  },
  mapFocusedTask: false,
  mapTaskList: true,
  background: "paimon",
  hiddenWidgets: {},
  lastChangelog: 0,
};

export const ServerList: Configs["server"][] = ["America", "Europe", "Asia", "TW, HK, MO"];
export const ConfigKeys = Object.keys(DefaultConfigs) as (keyof Configs)[];

// migration: if there is a token saved in localStorage, move it to cookies
if (typeof window !== "undefined") {
  const auth = localStorage.getItem("auth");

  if (auth) {
    localStorage.removeItem("auth");

    setAuthToken(undefined, JSON.parse(auth).token);
    setTimeout(() => window.location.reload());
  }
}

export const ConfigsContext = createContext<{
  ref: MutableRefObject<Configs>;
  set: Dispatch<SetStateAction<Configs>>;
  events: MultiMap<string, () => void>;
}>({
  ref: { current: DefaultConfigs },
  set: () => {},
  events: new MultiMap(),
});

export function useConfigs(): [Configs, Dispatch<SetStateAction<Configs>>] {
  const { ref, set, events } = useContext(ConfigsContext);
  const [, setUpdate] = useState(0);

  useEffect(() => {
    const handler = () => setUpdate((i) => i + 1);

    for (const key of ConfigKeys) {
      events.add(key, handler);
    }

    return () => {
      for (const key of ConfigKeys) {
        events.remove(key, handler);
      }
    };
  }, [ref, events]);

  return [ref.current, set];
}

export function useConfig<TKey extends keyof Configs>(
  key: TKey
): [Configs[TKey], Dispatch<SetStateAction<Configs[TKey]>>] {
  const { ref, set, events } = useContext(ConfigsContext);
  const [, setUpdate] = useState(0);

  useEffect(() => {
    const handler = () => setUpdate((i) => i + 1);

    events.add(key, handler);
    return () => {
      events.remove(key, handler);
    };
  }, [key, ref, events]);

  return [
    ref.current[key],
    useCallback(
      (newValue) => {
        set((value) => ({
          ...value,
          [key]: typeof newValue === "function" ? newValue(value[key]) : newValue,
        }));
      },
      [key, set]
    ),
  ];
}

export const SyncContext = createContext<{
  enabled: boolean;
  synchronize: () => Promise<void>;
}>({
  enabled: false,
  synchronize: () => Promise.resolve(),
});

export function useSync() {
  return useContext(SyncContext);
}

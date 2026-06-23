import React from "react";
import { RefreshControl } from "react-native";

/**
 * PULL-TO-REFRESH HELPER COMPONENT
 * 
 * A reusable RefreshControl component that handles pull-to-refresh UX
 * 
 * USAGE:
 * import { createRefreshControl } from "@/components/pull-to-refresh";
 * 
 * const MyComponent = () => {
 *   const { isRefreshing, refresh } = useEvents();
 *   const refreshControl = createRefreshControl(isRefreshing, refresh);
 *   
 *   return (
 *     <ScrollView refreshControl={refreshControl}>
 *       (content here)
 *     </ScrollView>
 *   );
 * };
 */
export const createRefreshControl = (
  isRefreshing: boolean,
  onRefresh: () => void | Promise<void>
): React.ReactElement => {
  return (
    <RefreshControl
      refreshing={isRefreshing}
      onRefresh={onRefresh}
      tintColor="#fff"
      progressBackgroundColor="#1a1a1a"
      colors={["#fff"]}
    />
  );
};

/**
 * Alternative: Use this if you want more control over the refresh component
 * 
 * USAGE:
 * const refreshControl = (
 *   <PullToRefresh
 *     isRefreshing={isRefreshing}
 *     onRefresh={refresh}
 *   />
 * );
 */
export interface PullToRefreshProps {
  isRefreshing: boolean;
  onRefresh: () => void | Promise<void>;
  tintColor?: string;
  progressBackgroundColor?: string;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  isRefreshing,
  onRefresh,
  tintColor = "#fff",
  progressBackgroundColor = "#1a1a1a",
}) => {
  return (
    <RefreshControl
      refreshing={isRefreshing}
      onRefresh={onRefresh}
      tintColor={tintColor}
      progressBackgroundColor={progressBackgroundColor}
      colors={[tintColor]}
    />
  );
};

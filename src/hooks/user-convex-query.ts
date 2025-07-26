import { useQuery, useMutation } from "convex/react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import type { FunctionReference, OptionalRestArgs } from "convex/server";

export const useConvexQuery = <Query extends FunctionReference<"query">>(
  query: Query,
  ...args: OptionalRestArgs<Query>
) => {
  const result = useQuery(query, ...args);
  const [data, setData] = useState<Query["_returnType"] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Use effect to handle the state changes based on the query result
  useEffect(() => {
    if (result === undefined) {
      setIsLoading(true);
    } else {
      try {
        setData(result);
        setError(null);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        toast.error(error.message);
      } finally {
        setIsLoading(false);
      }
    }
  }, [result]);

  return {
    data,
    isLoading,
    error,
  };
};

export const useConvexMutation = <
  Mutation extends FunctionReference<"mutation">,
  T = Mutation["_returnType"]
>(
  mutation: Mutation
) => {
  const mutationFn = useMutation(mutation);
  const [data, setData] = useState<T | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = async (
    args?: Mutation["_args"]
  ): Promise<T> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await mutationFn(args);
      setData(response);
      return response;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      toast.error(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return { mutate, data, isLoading, error };
};
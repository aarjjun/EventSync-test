
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface EventFiltersProps {
  filters: {
    community: string;
    status: string;
  };
  onFiltersChange: (filters: { community: string; status: string }) => void;
  communities: string[];
}

export const EventFilters = ({ filters, onFiltersChange, communities }: EventFiltersProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 p-4 bg-card rounded-lg">
      <div className="flex-1">
        <Label htmlFor="community-filter">Filter by Community</Label>
        <Select
          value={filters.community}
          onValueChange={(value) => 
            onFiltersChange({ ...filters, community: value })
          }
        >
          <SelectTrigger id="community-filter">
            <SelectValue placeholder="All Communities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Communities</SelectItem>
            {communities.map(community => (
              <SelectItem key={community} value={community}>
                {community}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1">
        <Label htmlFor="status-filter">Filter by Status</Label>
        <Select
          value={filters.status}
          onValueChange={(value) => 
            onFiltersChange({ ...filters, status: value })
          }
        >
          <SelectTrigger id="status-filter">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};


import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface DoctorSearchProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const DoctorSearch = ({ searchQuery, setSearchQuery }: DoctorSearchProps) => {
  return (
    <div className="relative max-w-md w-full">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
      <Input
        placeholder="Search by name, email or phone..."
        className="pl-10"
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
      />
    </div>
  );
};

export default DoctorSearch;

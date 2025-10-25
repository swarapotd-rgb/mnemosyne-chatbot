import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';

interface MedicalRecord {
  _id: string;
  timestamp: string;
  symptoms: string[];
  processedSummary: string;
  geminiInsights: {
    symptomTrends: string[];
    progressNotes: string;
    lifestyleTips: string[];
    redFlags: string[];
  };
}

interface MedicalHistoryProps {
  username: string | null;
}

const MedicalHistory: React.FC<MedicalHistoryProps> = ({ username }) => {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only fetch when a username is provided and re-fetch when it changes
    if (username) {
      fetchMedicalHistory();
    } else {
      setLoading(false);
    }
  }, [username]);

  const fetchMedicalHistory = async () => {
    try {
      if (!username) {
        console.log('No username provided'); // Debug log
        throw new Error('No user logged in');
      }
      console.log('Fetching medical history for user:', username); // Debug log

      const response = await fetch(`/api/medical-records/user/${username}`, {
        headers: {
          'Accept': 'application/json'
        }
      });

      console.log('Response status:', response.status); // Debug log

      const textResponse = await response.text();
      console.log('Raw response:', textResponse);

      // If server returned no body
      if (!textResponse || textResponse.trim() === '') {
        if (!response.ok) {
          throw new Error(`Server returned status ${response.status} with empty body`);
        }
        // No records available
        setRecords([]);
        return;
      }

      let data: any;
      try {
        data = JSON.parse(textResponse);
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        // If parsing fails, surface a clear message rather than crashing
        throw new Error('Invalid JSON response from server');
      }

      if (!response.ok) {
        console.error('Server error response:', data);
        throw new Error(data?.error || data?.message || `Failed to fetch medical records (status ${response.status})`);
      }

      console.log('Received data:', data);

      // Support both shapes: { records: [...] } or an array directly
      const recordsArray = Array.isArray(data) ? data : (Array.isArray(data.records) ? data.records : []);

      setRecords(recordsArray);
    } catch (error) {
      console.error('Error fetching medical history:', error);
      setRecords([]);
      // Show error message to user
      alert(error instanceof Error ? error.message : 'Failed to load medical history');
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = async (recordId: string) => {
    try {
      const response = await fetch(`/api/medical-records/report/${recordId}`);
      // Handle PDF download
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  if (loading) {
    return <div>Loading medical history...</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Medical History</h2>
      <div className="space-y-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Summary</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((record) => (
              <TableRow key={record._id}>
                <TableCell>{new Date(record.timestamp).toLocaleDateString()}</TableCell>
                <TableCell>
                  <div className="max-w-md">
                    <p className="font-medium">{record.processedSummary || 'No summary available'}</p>
                    {record.geminiInsights && Array.isArray(record.geminiInsights.redFlags) && record.geminiInsights.redFlags.length > 0 && (
                      <div className="mt-2 text-red-600">
                        <p className="font-semibold">Red Flags:</p>
                        <ul className="list-disc list-inside">
                          {record.geminiInsights.redFlags.map((flag, index) => (
                            <li key={index}>{flag}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Button
                    onClick={() => generatePDF(record._id)}
                    className="bg-blue-500 text-white"
                  >
                    Export PDF
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default MedicalHistory;

# Global Rules for Cursor

These rules govern Cursor's behavior across **all projects**, promoting scalable, efficient, and organized management of code, tasks, and documentation. Project-specific details, including file structures and tailored guidelines, are maintained in each project's `/documentation` directory and should be referenced as needed.

---

## General Principles

1. **Prioritize Clarity and Organization**  
   - Ensure code, tasks, and documentation are clear, well-structured, and easy to follow.  
   - Adhere to best practices for readability, scalability, and maintainability.

2. **Enforce Code and Content Limits**  
   - Limit code or content units to **no more than 250 lines**.  
   - For tasks exceeding this limit, break them into smaller, manageable parts using intermediate files (see below).

3. **Leverage Intermediate Files for Large Tasks**  
   - Use temporary intermediate files to manage extensive contexts or complex tasks.  
   - Name files sequentially (e.g., `intermediate_1.md`, `intermediate_2.md`) for clarity.  
   - Consolidate results into the final output and delete intermediate files once the task is complete.

4. **Keep Documentation Current**  
   - Update documentation whenever significant changes or new features are implemented.  
   - Ensure documentation remains accurate and comprehensive, referring to project-specific files for details.

5. **Focus on Security and Robustness**  
   - Implement proper error handling and follow security best practices in all code.  
   - Write maintainable, readable code to support long-term project success.

---

## Workflow Guidelines

- **Task Management**  
  - Focus on the current task, breaking it into smaller parts if it exceeds 250 lines.  
  - Use intermediate files to track progress and maintain clarity during complex operations.

- **File Management**  
  - Maintain logical file organization as defined by each project's documentation.  
  - Regularly clean up obsolete files to keep the workspace tidy and efficient.

- **Documentation Updates**  
  - Reflect all significant code or structural changes in the relevant documentation files.  
  - Maintain a changelog for historical context and an index for active file tracking, as specified in project-specific rules.

---

## Using Intermediate Files

Intermediate files are a key tool for managing large or complex tasks:

- **When to Use**:  
  - Any task involving more than 250 lines of code or content.  

- **How to Use**:  
  1. Create a new intermediate file (e.g., `intermediate_1.md`) for each part of the task.  
  2. Store partial outputs or reasoning steps in these files.  
  3. Once a part is complete, integrate it into the main output or relevant file.  
  4. Delete the intermediate files after consolidation to keep the workspace clean.

---

## Project-Specific Rules

For detailed instructions, such as file structures (e.g., `/temp/active`, `/temp/dormant`), active/dormant file management, and other project-specific guidelines, refer to the `/documentation` directory in each project. The files contained in this directory contain project specific instructions and complement the global User Rules and allow for customization tailored to individual project needs.